/** Shared iframe preview wrapper for library + template picker (matches Gmail-style preview). */
export const SIGNATURE_PREVIEW_DOC_PREFIX =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;font-family:Arial,sans-serif;font-size:12px;}</style></head><body>';

export const SIGNATURE_PREVIEW_DOC_SUFFIX = '</body></html>';

/** Preview area height — same scale as saved signature cards */
export const SIGNATURE_PREVIEW_FRAME_CLASS =
  'h-[min(240px,52vh)] sm:h-[200px] md:h-[220px] 2xl:h-[250px]';
