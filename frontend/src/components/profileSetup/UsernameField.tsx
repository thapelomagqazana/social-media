interface Props {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string | false;
}

const UsernameField = ({ value, onChange, error }: Props) => (
    <div>
    <label className="block mb-1 text-sm text-white">Username</label>
    <input
        value={value}
        onChange={onChange}
        placeholder="Write a username..."
        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

export default UsernameField;
