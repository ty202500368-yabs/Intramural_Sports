import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState, PageHeader } from '../components/ui';

export default function NotFound() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="404"
        title="Off the court"
        subtitle="That page isn't part of the playbook."
      />
      <EmptyState
        icon={Compass}
        title="We couldn't find that page"
        description="The link may be old, or the page may have moved. Head back to the season overview."
        action={
          <Link to="/" className="btn btn--primary btn--sm">
            Back to overview
          </Link>
        }
      />
    </div>
  );
}
