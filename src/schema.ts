import { z } from 'zod';

const text = z.string().trim().min(1);
const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Utiliser un identifiant stable en minuscules avec des tirets.');
const filePath = text.refine(value => !value.startsWith('/') && !value.includes('..') && !value.includes('\\') && !/^[a-z]+:/i.test(value), 'Chemin relatif au dossier public, sans ../ ni URL externe.');
export const variantSchema = z.object({ label: text, file: filePath, type: z.enum(['image', 'video', 'gif', 'audio']).optional(), width: z.number().int().positive(), height: z.number().int().positive() });
export const partSchema = z.object({ title: text, type: z.enum(['image', 'video', 'gif', 'audio']), file: filePath, thumbnail: filePath, width: z.number().int().positive(), height: z.number().int().positive(), alt: text });
export const mediaSchema = z.object({
  id: identifier, title: text, description: text,
  date: z.iso.date(), type: z.enum(['image', 'video', 'gif', 'audio']),
  category: identifier, tags: z.array(text).default([]),
  file: filePath, thumbnail: filePath,
  width: z.number().int().positive(), height: z.number().int().positive(),
  alt: text, featured: z.boolean().default(false), demo: z.boolean().default(false),
  variants: z.array(variantSchema).default([]), source: z.url().optional(), parts: z.array(partSchema).default([])
});
export const mediaDefinitionSchema = mediaSchema.extend({ order: z.number().int().default(1000) }).strict();
export const siteSettingsSchema = z.object({
  site: z.object({ name: text, eyebrow: text, headline: text, description: text, about: text, footer: text,
    socialImage: filePath.optional(), socialImageAlt: text.optional(),
    authorMessage: z.object({ title: text, paragraphs: z.array(text).min(1), signature: text, profileLabel: text,
      profileUrl: z.url().refine(value => new URL(value).protocol === 'https:', 'Le lien du profil doit utiliser HTTPS.') })
  }),
  labels: z.object({
    library: text, about: text, search: text, latest: text, all: text,
    video: text, image: text, gif: text, audio: text, allFormats: text,
    horizontal: text, square: text, vertical: text, allCategories: text,
    view: text, download: text, share: text, copyLink: text, copied: text,
    copyFailed: text, close: text, back: text, formatPreserved: text,
    noResults: text, reset: text, result: text, results: text, example: text,
    demoNotice: text, previous: text, next: text, page: text, original: text,
    variants: text, source: text, notFound: text, shareTitle: text,
    downloadGroup: text, groupFiles: text, part: text,
    shareOnX: text, unsupported: text, categories: text, featured: text
  }),
  shareMessage: text,
  categories: z.array(z.object({ id: identifier, label: text })),
  validationRules: z.object({
    checkedOn: z.iso.date(), source: z.url(),
    deploymentWarningMb: z.number().positive(), deploymentLimitMb: z.number().positive(),
    x: z.object({ imageMaxMb: z.number().positive(), gifMobileMaxMb: z.number().positive(), gifWebMaxMb: z.number().positive(), videoMaxMb: z.number().positive(), videoMaxSeconds: z.number().positive() })
  })
}).strict();
export const siteSchema = siteSettingsSchema.extend({ media: z.array(mediaSchema) });
export type Media = z.infer<typeof mediaSchema>;
export type SiteContent = z.infer<typeof siteSchema>;
export type Orientation = 'horizontal' | 'square' | 'vertical';
export function orientation(media: {width: number; height: number}): Orientation {
  return media.width === media.height ? 'square' : media.width > media.height ? 'horizontal' : 'vertical';
}
export function ratio(media: {width: number; height: number}): string {
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(media.width, media.height);
  return `${media.width / divisor}:${media.height / divisor}`;
}
