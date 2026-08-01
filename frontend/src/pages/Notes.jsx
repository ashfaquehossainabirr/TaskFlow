import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import NoteModal, { NOTE_COLORS } from '../components/NoteModal';
import api from '../api/axios';
import useDebounce from '../hooks/useDebounce';

const colorSwatch = (color) => NOTE_COLORS.find((c) => c.value === color)?.swatch || NOTE_COLORS[0].swatch;

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [activeNote, setActiveNote] = useState(null); // note being viewed/edited, or {} for "new"
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/notes', { params });
      setNotes(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const openNew = () => {
    setActiveNote(null);
    setShowModal(true);
  };

  const openNote = (note) => {
    setActiveNote(note);
    setShowModal(true);
  };

  const handleSaved = (saved) => {
    setNotes((list) => {
      const exists = list.some((n) => n._id === saved._id);
      const next = exists ? list.map((n) => (n._id === saved._id ? saved : n)) : [saved, ...list];
      return next.sort((a, b) => (b.pinned - a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt));
    });
    setShowModal(false);
  };

  const handleDeleted = (id) => {
    setNotes((list) => list.filter((n) => n._id !== id));
    setShowModal(false);
  };

  return (
    <PageShell
      title="My Notes"
      subtitle="Private notes only you can see — jot down anything you need to remember."
      actions={
        <button
          onClick={openNew}
          style={{
            background: 'var(--accent-cyan)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + New note
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your notes…"
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13.5,
            color: 'var(--text-primary)',
            minWidth: 260,
          }}
        />
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading notes…</div>}

      {!loading && notes.length === 0 && (
        <div
          style={{
            border: '1px dashed var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          {search ? 'No notes match your search.' : 'No notes yet. Create one to jot something down.'}
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {notes.map((n) => (
            <div key={n._id} onClick={() => openNote(n)} className="project-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: colorSwatch(n.color),
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {n.title}
                  </div>
                </div>
                {n.pinned && (
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent-cyan)', flexShrink: 0 }}>
                    PINNED
                  </span>
                )}
              </div>

              {n.content && (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {n.content}
                </p>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-hairline-soft)',
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                }}
              >
                Updated {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NoteModal note={activeNote} onClose={() => setShowModal(false)} onSaved={handleSaved} onDeleted={handleDeleted} />
      )}
    </PageShell>
  );
}
