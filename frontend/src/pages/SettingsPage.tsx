import DeleteAccountSection from "../components/settings/DeleteAccountSection";

const SettingsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 mt-20">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Future settings sections */}
      <div className="space-y-12">
        {/* Placeholder: Password, Preferences etc. */}

        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default SettingsPage;
