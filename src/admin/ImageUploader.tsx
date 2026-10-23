import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { requireApi } from '../lib/api';
import type { ImageFolder } from '../lib/backend';
import { useToast } from '../context/ToastContext';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  /** Called with every URL that was just uploaded, so the editor can clean up if the change is discarded. */
  onUploaded?: (url: string) => void;
  folder: ImageFolder;
  max?: number;
  label?: string;
}

export function ImageUploader({ images, onChange, onUploaded, folder, max = 8, label = 'Add photos' }: Props) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [dragging, setDragging] = useState(false);
  const single = max === 1;

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, Math.max(0, max - (single ? 0 : images.length)));
    if (files.length === 0) {
      toast.error(`You can add up to ${max} photo${max === 1 ? '' : 's'}.`);
      return;
    }
    setPending(files.length);
    const added: string[] = [];
    for (const file of files) {
      try {
        const url = await requireApi().uploadImage(file, folder);
        added.push(url);
        onUploaded?.(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed.');
      }
      setPending((n) => n - 1);
    }
    if (added.length) onChange(single ? [added[added.length - 1]] : [...images, ...added]);
    if (input.current) input.current.value = '';
  }

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const showDropzone = single ? images.length === 0 : images.length < max;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          <li key={url} className="group relative aspect-square overflow-hidden border border-neutral-200 bg-neutral-100">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {!single && i === 0 && (
              <span className="absolute left-1.5 top-1.5 bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 p-1 text-white">
              <div className="flex">
                {!single && (
                  <>
                    <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move earlier" className="p-1.5 hover:bg-white/20 disabled:opacity-30">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={i === images.length - 1} onClick={() => move(i, i + 1)} aria-label="Move later" className="p-1.5 hover:bg-white/20 disabled:opacity-30">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove photo" className="p-1.5 hover:bg-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}

        {Array.from({ length: pending }, (_, i) => (
          <li key={`pending-${i}`} className="flex aspect-square items-center justify-center border border-neutral-200 bg-neutral-50" aria-label="Uploading">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </li>
        ))}

        {showDropzone && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void handleFiles(e.dataTransfer.files);
              }}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed p-2 text-center text-xs font-medium transition-colors ${
                dragging ? 'border-ink bg-neutral-100' : 'border-neutral-300 text-neutral-500 hover:border-ink hover:text-ink'
              }`}
            >
              <ImagePlus className="h-6 w-6" aria-hidden />
              {label}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => e.target.files && void handleFiles(e.target.files)}
      />
    </div>
  );
}
