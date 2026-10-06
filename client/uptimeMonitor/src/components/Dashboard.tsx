import { useState, useEffect } from "react";

interface Site {
  id: number;
  name: string;
  url: string;
  status: string;
  stats?: {
    upPercentage: number;
    avg_response_time: number;
  };
}

interface History {
  id: number;
  site_id: number;
  status: string;
  response_time: number | null;
  checked_at: string;
}

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [siteList, setSiteList] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<History[]>([]);

  const fetchSiteList = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3000/api/sites", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    const statsPromises = data.map((site: Site) =>
      fetch(`http://localhost:3000/api/sites/${site.id}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).then((res) => res.json())
    );

    const allStats = await Promise.all(statsPromises);

    if (response.ok) {
      const sitesWithStats = data.map((site: Site, index: number) => ({
        ...site,
        stats: allStats[index],
      }));
      setSiteList(sitesWithStats);
    } else {
      console.error("Error fetching site list:", data.message);
    }
  };

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSiteList();
      const interval = setInterval(fetchSiteList, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval); // Cleanup on unmount
    } catch (error) {
      console.error("Error fetching site list:", error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const pageName = (form.elements.namedItem("pageName") as HTMLInputElement)
      .value;
    const pageUrl = (form.elements.namedItem("pageUrl") as HTMLInputElement)
      .value;
    try {
      new URL(pageUrl);
    } catch {
      alert("Invalid URL format. Please enter a valid URL.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: pageName, url: pageUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        setSiteList((prevList) => [...prevList, data]);
      } else {
        console.error("Error adding site:", data.message);
      }
    } catch (error) {
      console.error("Error adding site:", error);
    }
  };

  const handleDelete = async (siteId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/sites/${siteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setSiteList((prevList) =>
          prevList.filter((site) => site.id !== siteId)
        );
      } else {
        const data = await response.json();
        console.error("Error deleting site:", data.message);
      }
    } catch (error) {
      console.error("Error deleting site:", error);
    }
  };

  const handleSiteClick = async (site: Site) => {
    setSelectedSite(site);
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:3000/api/sites/${site.id}/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      setHistory(data);
    } else {
      console.error("Error fetching site history:", data.message);
    }
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Uptime Monitor</h2>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              onLogout();
            }}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-4 rounded-lg mb-8 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label
              className="block text-gray-300 mb-1 text-sm"
              htmlFor="pageName"
            >
              Name
            </label>
            <input
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              type="text"
              id="pageName"
              name="pageName"
              placeholder="Google"
            />
          </div>
          <div className="flex-1">
            <label
              className="block text-gray-300 mb-1 text-sm"
              htmlFor="pageUrl"
            >
              URL
            </label>
            <input
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              type="text"
              id="pageUrl"
              name="pageUrl"
              placeholder="https://google.com"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Add
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {siteList.map((site) => (
            <div
              key={site.id}
              className="bg-gray-800 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSiteClick(site)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    site.stats?.upPercentage === 100
                      ? "bg-green-500"
                      : site.stats?.upPercentage && site.stats.upPercentage > 90
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <div>
                  <h3 className="text-white font-semibold">{site.name}</h3>
                  <p className="text-gray-400 text-sm">{site.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {site.stats?.upPercentage ?? "—"}%
                  </p>
                  <p className="text-gray-400 text-xs">uptime</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {site.stats?.avg_response_time ?? "—"}ms
                  </p>
                  <p className="text-gray-400 text-xs">avg response</p>
                </div>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 transition-colors text-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && selectedSite && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedSite.name} — History
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Response</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-700/50">
                    <td className="py-2 text-gray-300">
                      {new Date(entry.checked_at).toLocaleString()}
                    </td>
                    <td
                      className={`py-2 ${
                        entry.status === "up"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {entry.status}
                    </td>
                    <td className="py-2 text-gray-300 text-right">
                      {entry.response_time ?? "—"}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
