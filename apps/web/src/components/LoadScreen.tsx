import { Loader2Icon } from 'lucide-react';

export default function LoadScreen() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2Icon className="animate-spin" />
    </div>
  );
}
