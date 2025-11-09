// FactCard.tsx
// resuable for the fact cards on the hero cover 

interface FactCardProps {
  title: string;
  description: string;
}

function FactCard({title, description} : FactCardProps) {
  return (
    <div className = "fact-card">
      <h4 className="text-xl bg-amber-600"> {title}</h4>
      <p>{description}</p>
    </div>
  );
}

export default FactCard