export default function DamageFloat({ text, x, y }) {
  return (
    <div className="damage-float" style={{ left: `${x}%`, top: `${y}%` }}>
      {text}
    </div>
  );
}
