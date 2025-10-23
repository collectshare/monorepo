
import { FileUpIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from './Button';
import { Input } from './Input';

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function FileUpload({ value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState(value?.name);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onChange(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName(undefined);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6">
        {!fileName ? (
          <>
            <FileUpIcon className="w-12 h-12 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
            </p>
            <Input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              Selecione o arquivo
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{fileName}</p>
            <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
