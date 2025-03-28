import { useRef, useEffect, useState } from "react";

interface Props {
  value: File | null;
  onChange: (file: File) => void;
  error?: boolean;
}

const AvatarUploader = ({ value, onChange, error }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  return (
    <div className="text-center">
      <div
        onClick={() => inputRef.current?.click()}
        className={`mx-auto w-24 h-24 rounded-full bg-white/10 cursor-pointer hover:opacity-80 border-2 border-dashed ${error ? "border-red-500" : "border-white"}`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full rounded-full object-cover" />
        ) : (
          <p className="text-xs text-white pt-8">Click to Upload</p>
        )}
      </div>
      <input type="file" accept="image/*" hidden ref={inputRef} onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
      {error && <p className="text-red-400 text-xs mt-1">Avatar is required</p>}
    </div>
  );
};

export default AvatarUploader;
