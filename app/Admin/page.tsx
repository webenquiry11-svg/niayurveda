'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/Records');
        const data = await res.json();
        if (data.success) setRecords(data.data);
      } catch (error) {
        toast.error('Failed to fetch records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record =>
    record.basicInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.basicInfo?.phoneNo?.includes(searchTerm) ||
    record.basicInfo?.opdNo?.includes(searchTerm)
  );

  const stats = {
    total: records.length,
    thisMonth: records.filter(r => {
      const date = new Date(r.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 sm:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-1">Clinical Records Dashboard</h1>
            <p className="text-slate-600 text-sm">Manage and view all patient clinical records</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg">Logout</button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Records</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg"><span className="text-2xl">📋</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.thisMonth}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg"><span className="text-2xl">📅</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{records.filter(r => !r.diagnosis).length}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg"><span className="text-2xl">⏳</span></div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, phone, or OPD number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <p className="text-slate-500 font-bold text-lg">Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <p className="text-slate-500 font-bold text-lg">No clinical records found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <th className="p-5 text-left font-bold">Patient Name</th>
                    <th className="p-5 text-left font-bold">Age / Sex</th>
                    <th className="p-5 text-left font-bold">Contact</th>
                    <th className="p-5 text-left font-bold">OPD / IPD</th>
                    <th className="p-5 text-left font-bold">Chief Complaint</th>
                    <th className="p-5 text-left font-bold">Submitted</th>
                    <th className="p-5 text-left font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((record, i) => (
                    <React.Fragment key={i}>
                      <tr className="hover:bg-blue-50 transition-colors cursor-pointer border-b">
                        <td className="p-5">
                          <div className="font-bold text-slate-900">{record.basicInfo?.name}</div>
                          <div className="text-xs text-slate-500 mt-1">{record.basicInfo?.fatherHusbandName ? `S/O: ${record.basicInfo.fatherHusbandName}` : ''}</div>
                        </td>
                        <td className="p-5">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{record.basicInfo?.age} y, {record.basicInfo?.sex}</span>
                        </td>
                        <td className="p-5 text-slate-600">{record.basicInfo?.phoneNo || 'N/A'}</td>
                        <td className="p-5">
                          <div className="text-sm">
                            {record.basicInfo?.opdNo && <div className="text-slate-900 font-medium">OPD: {record.basicInfo.opdNo}</div>}
                            {record.basicInfo?.ipdNo && <div className="text-slate-900 font-medium">IPD: {record.basicInfo.ipdNo}</div>}
                          </div>
                        </td>
                        <td className="p-5 text-slate-600 max-w-xs truncate">{record.history?.chiefComplaints || 'N/A'}</td>
                        <td className="p-5 text-slate-600 text-sm">{new Date(record.createdAt).toLocaleDateString()}</td>
                        <td className="p-5">
                          <button
                            onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            {expandedId === record._id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedId === record._id && (
                        <tr className="bg-slate-50 border-b">
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Basic Info Section */}
                              <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-3 text-lg">👤 Basic Information</h3>
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-medium text-slate-700">Name:</span> {record.basicInfo?.name}</div>
                                  <div><span className="font-medium text-slate-700">Age:</span> {record.basicInfo?.age}</div>
                                  <div><span className="font-medium text-slate-700">Sex:</span> {record.basicInfo?.sex}</div>
                                  <div><span className="font-medium text-slate-700">Address:</span> {record.basicInfo?.address || 'N/A'}</div>
                                  <div><span className="font-medium text-slate-700">Religion:</span> {record.basicInfo?.religion || 'N/A'}</div>
                                  <div><span className="font-medium text-slate-700">Occupation:</span> {record.basicInfo?.occupation || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Vital Signs */}
                              {record.physicalExamination?.vitals && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                  <h3 className="font-bold text-slate-900 mb-3 text-lg">💓 Vital Signs</h3>
                                  <div className="space-y-2 text-sm">
                                    <div><span className="font-medium text-slate-700">BP:</span> {record.physicalExamination.vitals.bp || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Pulse Rate:</span> {record.physicalExamination.vitals.pulseRate || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Respiratory Rate:</span> {record.physicalExamination.vitals.respiratoryRate || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Temperature:</span> {record.physicalExamination.vitals.temp || 'N/A'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Chief Complaints */}
                              <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-3 text-lg">⚕️ Chief Complaints</h3>
                                <p className="text-sm text-slate-700">{record.history?.chiefComplaints || 'N/A'}</p>
                              </div>

                              {/* Diagnosis */}
                              <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-3 text-lg">🔬 Diagnosis</h3>
                                <p className="text-sm text-slate-700">{record.diagnosis || 'Pending'}</p>
                                {record.diagnosisImageUrl && (
                                  <img src={record.diagnosisImageUrl} alt="Diagnosis" className="mt-3 max-w-xs rounded-lg border border-slate-300" />
                                )}
                              </div>

                              {/* Physical Examination */}
                              {record.physicalExamination && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                  <h3 className="font-bold text-slate-900 mb-3 text-lg">🏥 Physical Examination</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-slate-700">Weight:</span> {record.physicalExamination.weight || 'N/A'} kg</div>
                                    <div><span className="font-medium text-slate-700">Height:</span> {record.physicalExamination.height || 'N/A'} cm</div>
                                    <div><span className="font-medium text-slate-700">General Appearance:</span> {record.physicalExamination.generalAppearance || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Built:</span> {record.physicalExamination.built || 'N/A'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Ayurvedic Parameters */}
                              {record.dashavidhaParikshana && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                  <h3 className="font-bold text-slate-900 mb-3 text-lg">🧘 Dashavidha Parikshana</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-slate-700">Prakriti (Body):</span> {record.dashavidhaParikshana.prakritiSharirik || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Prakriti (Mind):</span> {record.dashavidhaParikshana.prakritiMansika || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Vikriti Dosha:</span> {record.dashavidhaParikshana.vikritiDosha || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Saara:</span> {record.dashavidhaParikshana.saara || 'N/A'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Tongue Examination */}
                              {record.jivhaPariksha && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                  <h3 className="font-bold text-slate-900 mb-3 text-lg">👅 Jivha Pariksha (Tongue)</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-slate-700">Color:</span> {record.jivhaPariksha.color || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Coating:</span> {record.jivhaPariksha.coating || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Texture:</span> {record.jivhaPariksha.texture || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Moisture:</span> {record.jivhaPariksha.moisture || 'N/A'}</div>
                                  </div>
                                  {record.jivhaPariksha.imageUrl && (
                                    <img src={record.jivhaPariksha.imageUrl} alt="Tongue" className="mt-3 max-w-xs rounded-lg border border-slate-300" />
                                  )}
                                </div>
                              )}

                              {/* Personal History */}
                              {record.personalHistory && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                  <h3 className="font-bold text-slate-900 mb-3 text-lg">📝 Personal History</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-slate-700">Diet:</span> {record.personalHistory.diet || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Sleep:</span> {record.personalHistory.sleep || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Exercise:</span> {record.personalHistory.exercise || 'N/A'}</div>
                                    <div><span className="font-medium text-slate-700">Addiction:</span> {Array.isArray(record.personalHistory.addiction) ? record.personalHistory.addiction.join(', ') || 'None' : 'N/A'}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        setHasAdmin(data.hasAdmin);
        if (data.isAuthenticated) setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to check admin status.");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Sending setup link...');
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Setup email sent! Please check your inbox.', { id: loadingToast });
        setEmail('');
      } else {
        toast.error(data.message || 'Failed to send email.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred.', { id: loadingToast });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Logging in...');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Logged in successfully!', { id: loadingToast });
        setIsAuthenticated(true);
      } else {
        toast.error(data.message || 'Invalid credentials.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred.', { id: loadingToast });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/check', { method: 'DELETE' });
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Loading...</div>;

  if (isAuthenticated) return <AdminDashboard onLogout={handleLogout} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 text-center">
            {hasAdmin ? 'Admin Login' : 'Initialize Admin'}
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2">
            {hasAdmin ? 'Enter your credentials to access the dashboard' : 'Enter your email to receive a secure setup link'}
          </p>
        </div>

        {!hasAdmin ? (
          <form onSubmit={handleInit} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Master Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hospital.com" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all">
              Send Setup Link
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Username</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_user" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-slate-800 transition-all">
              Login to Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
