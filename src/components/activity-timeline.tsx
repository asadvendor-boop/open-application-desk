import type { ActivityEntry } from "@/domain/application/types";

interface ActivityTimelineProps {
  activity: ActivityEntry[];
}

function timeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function ActivityTimeline({ activity }: ActivityTimelineProps) {
  const recent = [...activity].reverse().slice(0, 8);

  return (
    <section className="rail-card activity-card" aria-labelledby="activity-title">
      <div className="rail-card__heading">
        <div>
          <p className="eyebrow">Shared record</p>
          <h2 id="activity-title">Application activity</h2>
        </div>
        <span className="activity-count">{activity.length}</span>
      </div>

      {recent.length === 0 ? (
        <p className="empty-state">
          Edits, audits, proposals, authorization, and submission will appear here.
        </p>
      ) : (
        <ol className="activity-list">
          {recent.map((entry) => (
            <li key={entry.id}>
              <span className={`actor-dot actor-dot--${entry.actor}`} aria-hidden="true" />
              <div>
                <div className="activity-meta">
                  <strong>{entry.action.replaceAll("_", " ")}</strong>
                  <span>{entry.actor} · {timeLabel(entry.createdAt)}</span>
                </div>
                <p>{entry.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
