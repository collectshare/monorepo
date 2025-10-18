import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h1 className="text-9xl">404</h1>
      <Link to="/" className="mt-4 underline tracking-tight">
        Voltar ao início.
      </Link>
    </div>
  );
}
