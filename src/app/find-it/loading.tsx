export default function FindItLoading() {
  return (
    <div className="loading-state" role="status">
      <span className="loading-mark" aria-hidden="true" />
      <div>
        <strong>Loading Find It</strong>
        <p>Your private inventory is on its way.</p>
      </div>
    </div>
  );
}
