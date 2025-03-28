interface Props {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string | false;
}

const BioField = ({ value, onChange, error }: Props) => (
    <div>
    <label className="block mb-1 text-sm text-white">Bio</label>
    <input
        value={value}
        onChange={onChange}
        placeholder="Write a short bio..."
        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

export default BioField;
