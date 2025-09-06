'use client';

export default function Error({ error, reset }) {
  console.error('[admin] client error:', error);
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Application error</h1>
      <p className="opacity-80 mb-4">
        A client-side exception occurred while loading this page.
      </p>
      <pre className="bg-black/50 border border-white/10 p-3 rounded overflow-auto text-xs">
        {String(error?.stack || error?.message || error)}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Reload page
      </button>
    </div>
  );
}
