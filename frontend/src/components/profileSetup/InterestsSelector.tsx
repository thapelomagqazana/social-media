const INTERESTS = ["Music", "Coding", "Fitness", "Gaming", "Reading", "Design", "Travel"];

interface Props {
    selected: string[];
    onChange: (items: string[]) => void;
    error?: string | false;
}

const InterestsSelector = ({ selected, onChange, error }: Props) => {
    const toggle = (interest: string) => {
        if (selected.includes(interest)) {
        onChange(selected.filter((i) => i !== interest));
        } else {
        onChange([...selected, interest]);
        }
    };

    return (
        <div>
        <label className="block mb-1 text-sm text-white">Interests</label>
        <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
            <button
                type="button"
                key={interest}
                onClick={() => toggle(interest)}
                className={`px-3 py-1 rounded-full text-sm border ${
                selected.includes(interest)
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-gray-300 border-white/20"
                } hover:opacity-80 transition`}
            >
                {interest}
            </button>
            ))}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default InterestsSelector;
