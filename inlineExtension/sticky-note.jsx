import "./StickyNote.css"

export default function StickyNote() {
  const {note, updateNote, clearNote, saving, lastSaved, loaded} = useNoteStorage();
  
  const handleCopy = () => {
    const content = [note.title, note.text].filter(Boolean).join("\n");
    navigator.clipboard.writeText(content);
  };

  const formattedTime = lastSaved
    ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  
  return (
    <div className="note">
      <div className="sticky-note-header">Sticky Note</div>
      <textarea name= "" id="" cols="30" rows="10" placeholder="Write your note here..."></textarea>
      
    </div>
  )
}