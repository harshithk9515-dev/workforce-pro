import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, total, onPageChange }) => {
  if (!pages || pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
      <span>
        Page <span className="font-medium text-ink">{page}</span> of{' '}
        <span className="font-medium text-ink">{pages}</span> · {total} total
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-secondary !px-2 !py-1.5"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="btn-secondary !px-2 !py-1.5"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
