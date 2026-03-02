import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Editor from 'react-simple-code-editor';
import { Copy, LayoutGrid, LayoutList } from 'lucide-react';
import { TEMPLATES, resolveTemplate } from './templates';
import type { SignatureValues } from './types';
import { DEFAULT_SIGNATURE_VALUES } from './types';
import { highlightTemplateVariables } from './utils/highlight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function App() {
  const { t, i18n } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    TEMPLATES[0]?.id ?? 'default'
  );
  const [templateHtml, setTemplateHtml] = useState(
    () => TEMPLATES[0]?.html ?? ''
  );
  const [values, setValues] = useState<SignatureValues>(
    () => ({ ...DEFAULT_SIGNATURE_VALUES, ...TEMPLATES[0]?.defaultValues })
  );
  const [copied, setCopied] = useState(false);
  const [layoutVertical, setLayoutVertical] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const resolvedHtml = resolveTemplate(templateHtml, values);

  const resizePreviewToContent = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (!iframe) return;
    if (!layoutVertical) {
      iframe.style.height = '';
      return;
    }
    if (!iframe.contentDocument?.body) return;
    try {
      const doc = iframe.contentDocument;
      const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      iframe.style.height = `${height}px`;
    } catch {
      // Cross-origin or other access error
    }
  }, [layoutVertical]);

  useEffect(() => {
    if (layoutVertical) {
      const timer = setTimeout(resizePreviewToContent, 50);
      return () => clearTimeout(timer);
    } else {
      resizePreviewToContent();
    }
  }, [layoutVertical, resolvedHtml, resizePreviewToContent]);

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplateId(templateId);
        setTemplateHtml(template.html);
      }
    },
    []
  );

  const updateValue = useCallback((key: keyof SignatureValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resolvedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = resolvedHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [resolvedHtml]);

  const toggleLayout = useCallback(() => {
    setLayoutVertical((prev) => !prev);
  }, []);

  const fieldConfig = [
    { key: 'NAME' as const, labelKey: 'name' as const },
    { key: 'POSITION' as const, labelKey: 'position' as const },
    { key: 'COMPANY' as const, labelKey: 'company' as const },
    { key: 'LINKEDIN_URL' as const, labelKey: 'linkedinUrl' as const },
    { key: 'PHONE' as const, labelKey: 'phone' as const },
    { key: 'EMAIL' as const, labelKey: 'email' as const },
    { key: 'WEBSITE' as const, labelKey: 'website' as const },
    { key: 'IMAGE' as const, labelKey: 'image' as const },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {t('app.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('app.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="template" className="text-muted-foreground text-xs">
                  {t('labels.template')}
                </Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger id="template" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((tmpl) => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select
                value={i18n.language}
                onValueChange={(v) => i18n.changeLanguage(v)}
              >
                <SelectTrigger className="w-[80px]" aria-label={t('language')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLayout}
                title={
                  layoutVertical
                    ? t('actions.layoutHorizontal')
                    : t('actions.layoutVertical')
                }
              >
                {layoutVertical ? (
                  <LayoutGrid className="size-4" />
                ) : (
                  <LayoutList className="size-4" />
                )}
              </Button>
              <Button onClick={handleCopy} size="sm">
                <Copy className="size-4" />
                {copied ? t('actions.copied') : t('actions.copy')}
              </Button>
            </div>
          </div>

          <Card className="mt-4 border-0 bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t('labels.values')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {fieldConfig.map(({ key, labelKey }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-xs">
                      {t(`fields.${labelKey}`)}
                    </Label>
                    <Input
                      id={key}
                      type={
                        key === 'EMAIL'
                          ? 'email'
                          : key === 'PHONE'
                            ? 'tel'
                            : key === 'IMAGE' ||
                                key === 'LINKEDIN_URL' ||
                                key === 'WEBSITE'
                              ? 'url'
                              : 'text'
                      }
                      value={values[key]}
                      onChange={(e) => updateValue(key, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <main
        className={`flex-1 grid min-h-0 ${
          layoutVertical
            ? 'grid-cols-1 grid-rows-[auto_1fr]'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        <section
          className={`flex flex-col min-h-0 border-b md:border-b-0 ${
            layoutVertical ? 'order-2 border-t' : 'md:border-r'
          }`}
        >
          <div className="px-4 py-2 bg-muted/30 border-b">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('labels.html')}
            </h2>
          </div>
          <div className="flex-1 min-h-[300px] overflow-auto">
            <Editor
              value={templateHtml}
              onValueChange={setTemplateHtml}
              highlight={highlightTemplateVariables}
              padding={12}
              className="html-editor min-h-full w-full font-mono text-sm"
              textareaClassName="html-textarea"
              style={{
                fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                fontSize: 13,
                minHeight: 300,
              }}
            />
          </div>
        </section>

        <section
          className={`flex flex-col min-h-0 ${
            layoutVertical ? 'order-1' : ''
          }`}
        >
          <div className="px-4 py-2 bg-muted/30 border-b">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('labels.preview')}
            </h2>
          </div>
          <div
            className={`overflow-auto bg-background ${
              layoutVertical ? 'flex-none' : 'flex-1 min-h-[300px]'
            }`}
          >
            <iframe
              ref={previewIframeRef}
              title="Signature preview"
              className="w-full min-h-full border-0 block"
              onLoad={() => layoutVertical && resizePreviewToContent()}
              srcDoc={
                '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;}</style></head><body>' +
                resolvedHtml +
                '</body></html>'
              }
              sandbox="allow-same-origin"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
