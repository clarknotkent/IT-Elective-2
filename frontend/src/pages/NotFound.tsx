import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-[520px] pt-8 flex flex-col gap-3 items-start">
      <span className="font-display text-[72px] leading-none text-accent-500">404</span>
      <h1 className="font-display text-3xl font-bold text-ink">That page isn't on the shelf</h1>
      <p className="text-md text-ink/70">The link may be old, or the item it pointed at has since been deleted.</p>
      <Link to="/" className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-bg text-base font-bold font-display rounded-pill hover:bg-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2">
        Back to overview
      </Link>
    </div>
  );
}
