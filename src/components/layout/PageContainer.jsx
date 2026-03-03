import "./PageContainer.css";

export function PageContainer({ children, className = "" }) {
  return <div className={`page-container ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function PageSection({ title, description, children, className = "" }) {
  return (
    <section className={`page-section ${className}`}>
      {(title || description) && (
        <div className="page-section-header">
          {title && <h2 className="page-section-title">{title}</h2>}
          {description && (
            <p className="page-section-description">{description}</p>
          )}
        </div>
      )}
      <div className="page-section-content">{children}</div>
    </section>
  );
}
