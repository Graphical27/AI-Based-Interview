import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

const resolveInterviewDuration = (job) => {
  return Number(job?.interviewDurationMinutes) || Number(job?.durationMinutes) || 20;
};

const jobsSeed = [];

const categories = ['All','Engineering','Data','Product','Design'];
const types = ['All','Full-time','Contract','Part-time','Internship'];

const JobsView = () => {
  const navigate = useNavigate();
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All');
  const [jobType,setJobType] = useState('All');
  const [filters,setFilters] = useState({remote: false, urgent: false, verified: false});
  const [selectedJob, setSelectedJob] = useState(null);
  const [saved,setSaved] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myApplications, setMyApplications] = useState([]);
  const [applying, setApplying] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.listJobs({ q: query, category, type: jobType, remote: filters.remote, urgent: filters.urgent, verified: filters.verified });
        if (mounted) {
          setJobs(data.items);
        }
      } catch (e) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [query, category, jobType, filters]);

  // Fetch user's applications
  useEffect(() => {
    const fetchMyApplications = async () => {
      try {
        const applications = await api.getMyApplications();
        setMyApplications(applications);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      }
    };
    fetchMyApplications();
  }, []);

  const navigateToInterview = (job) => {
    navigate('/interview', {
      state: {
        job,
        durationMinutes: resolveInterviewDuration(job),
      }
    });
  };

  const handleApplyToJob = async (job) => {
    const jobId = job._id;
    setApplying(prev => new Set(prev).add(jobId));
    try {
      await api.applyForJob(jobId);
      // Refresh applications
      const applications = await api.getMyApplications();
      setMyApplications(applications);
      navigateToInterview(job);
    } catch (error) {
      console.error('Failed to apply:', error);
      const alreadyApplied = error.status === 400 && /already applied/i.test(error.message || '');
      if (alreadyApplied) {
        navigateToInterview(job);
      } else {
        alert(error.message || 'Failed to apply for job');
      }
    } finally {
      setApplying(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };
  const [page,setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(()=>{
    return jobs.filter(j=>{
      const matchQ = j.title.toLowerCase().includes(query.toLowerCase()) || 
                    j.company.toLowerCase().includes(query.toLowerCase()) ||
                    (j.tags||[]).some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      const matchC = category==='All'|| j.category===category;
      const matchT = jobType==='All'|| j.type===jobType;
      const matchRemote = !filters.remote || j.remote;
      const matchUrgent = !filters.urgent || j.urgent;
      const matchVerified = !filters.verified || j.verified;
      return matchQ && matchC && matchT && matchRemote && matchUrgent && matchVerified;
    });
  },[jobs,query,category,jobType,filters]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  const toggleSave = (id)=>{
    setSaved(prev=>{const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n;});
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Jobs', value: jobs.length, icon: '💼', color: 'from-blue-400 to-blue-600' },
          { label: 'Remote Jobs', value: jobs.filter(j => j.remote).length, icon: '🏠', color: 'from-green-400 to-green-600' },
          { label: 'Urgent Hiring', value: jobs.filter(j => j.urgent).length, icon: '⚡', color: 'from-orange-400 to-orange-600' },
          { label: 'Verified', value: jobs.filter(j => j.verified).length, icon: '✅', color: 'from-purple-400 to-purple-600' }
        ].map((stat, index) => (
          <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-gray-700/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-gradient-to-br from-gray-900/50 to-black rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
        <div className="space-y-6">
          {/* Main Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <input 
              value={query} 
              onChange={e=>setQuery(e.target.value)} 
              placeholder="Search jobs, companies, skills, or locations..." 
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none transition-all text-lg backdrop-blur-sm"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4">
            <select 
              value={category} 
              onChange={e=>setCategory(e.target.value)} 
              className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none transition-all backdrop-blur-sm"
            >
              {categories.map(c=> <option key={c} value={c}>{c} Category</option>)}
            </select>
            
            <select 
              value={jobType} 
              onChange={e=>setJobType(e.target.value)} 
              className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none transition-all backdrop-blur-sm"
            >
              {types.map(t=> <option key={t} value={t}>{t === 'All' ? 'All Job Types' : t}</option>)}
            </select>

            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400/20 focus:ring-offset-gray-800"
                checked={filters.remote}
                onChange={e=>setFilters(prev=>({...prev, remote: e.target.checked}))}
              />
              <span className="text-sm font-medium">Remote only</span>
            </label>

            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-700 text-orange-400 focus:ring-orange-400/20 focus:ring-offset-gray-800"
                checked={filters.urgent}
                onChange={e=>setFilters(prev=>({...prev, urgent: e.target.checked}))}
              />
              <span className="text-sm font-medium">Urgent hiring</span>
            </label>

            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-700 text-blue-400 focus:ring-blue-400/20 focus:ring-offset-gray-800"
                checked={filters.verified}
                onChange={e=>setFilters(prev=>({...prev, verified: e.target.checked}))}
              />
              <span className="text-sm font-medium">Verified companies</span>
            </label>

            <button 
              onClick={() => {setQuery(''); setCategory('All'); setJobType('All'); setFilters({remote: false, urgent: false, verified: false});}}
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-green-400 border border-gray-700 hover:border-green-400/50 rounded-xl transition-all backdrop-blur-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Enhanced Job Grid */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {filtered.length} {filtered.length === 1 ? 'Job' : 'Jobs'} Found
              {query && <span className="text-green-400 ml-2">for "{query}"</span>}
            </h2>
            <select className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-green-400 outline-none backdrop-blur-sm">
              <option>Sort by: Relevance</option>
              <option>Sort by: Date Posted</option>
              <option>Sort by: Salary (High to Low)</option>
              <option>Sort by: Salary (Low to High)</option>
            </select>
          </div>

          {/* Enhanced Job Cards */}
          <div className="space-y-6">
            {loading && <p className="text-gray-400">Loading jobs...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && paged.map(job => (
              <div 
                key={job._id}
                className={`group relative bg-gradient-to-br from-gray-900/80 to-black border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-black/20 ${
                  selectedJob?._id === job._id 
                    ? 'border-green-400 ring-2 ring-green-400/20 shadow-lg shadow-green-400/10' 
                    : 'border-gray-800/50 hover:border-gray-700'
                }`}
                onClick={() => setSelectedJob(job)}
              >
                {/* Urgent Badge */}
                {job.urgent && (
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-black text-xs font-bold rounded-full shadow-lg">
                    URGENT
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-2xl shadow-lg">
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">{job.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-green-400 font-semibold">{job.company}</p>
                          {job.verified && (
                            <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          job.type === 'Full-time' ? 'bg-green-400/20 text-green-400 border-green-400/30' :
                          job.type === 'Contract' ? 'bg-blue-400/20 text-blue-400 border-blue-400/30' :
                          job.type === 'Part-time' ? 'bg-purple-400/20 text-purple-400 border-purple-400/30' :
                          'bg-gray-400/20 text-gray-400 border-gray-400/30'
                        }`}>
                          {job.type}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">{relativeTime(job.postedAt)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                        </svg>
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4a8 8 0 1 0 8 8 8.01 8.01 0 0 0-8-8zm.5 4h-1v5l4.25 2.52.5-.84-3.75-2.18z" />
                        </svg>
                        {resolveInterviewDuration(job)} min interview
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {job.remote && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded-lg border border-green-400/20">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                          </svg>
                          Remote
                        </div>
                      )}
                      {job.verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-400/10 text-blue-400 text-xs rounded-lg border border-blue-400/20">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(job.tags||[]).slice(0, 4).map(skill => (
                        <span key={skill} className="px-3 py-1 bg-gray-800/60 text-gray-300 text-xs rounded-lg border border-gray-700/50 hover:bg-gray-700/60 transition-colors">
                          {skill}
                        </span>
                      ))}
                      {Array.isArray(job.tags) && job.tags.length > 4 && (
                        <span className="px-3 py-1 bg-gray-800/60 text-gray-400 text-xs rounded-lg border border-gray-700/50">
                          +{(job.tags||[]).length - 4} more
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{job.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                  <div className="flex gap-3">
                    {(() => {
                      const hasApplied = myApplications.some(app => app.job._id === job._id);
                      const isApplying = applying.has(job._id);
                      
                      if (hasApplied) {
                        const application = myApplications.find(app => app.job._id === job._id);
                        return (
                          <button 
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-blue-400/20 text-blue-400 border border-blue-400/30 font-semibold rounded-lg text-sm"
                          >
                            ✓ Applied ({application.status})
                          </button>
                        );
                      }
                      
                      return (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleApplyToJob(job);}}
                          disabled={isApplying}
                          className="flex items-center gap-2 px-4 py-2 bg-green-400 hover:bg-green-500 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-all text-sm shadow-lg shadow-green-400/25 disabled:shadow-none"
                        >
                          {isApplying ? 'Applying...' : 'Apply Now'}
                        </button>
                      );
                    })()}
                    <button 
                      onClick={(e) => {e.stopPropagation(); toggleSave(job._id);}}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all text-sm ${
                        saved.has(job._id) 
                          ? 'bg-green-400/20 text-green-400 border-green-400/30' 
                          : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={saved.has(job._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                      {saved.has(job._id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                    className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-1"
                  >
                    View Details
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button 
                disabled={page===1} 
                onClick={()=>setPage(p=>Math.max(1,p-1))} 
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                <button 
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    page === pageNum 
                      ? 'bg-green-400 text-black border-green-400 shadow-lg shadow-green-400/25' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700/50 backdrop-blur-sm'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                disabled={page===totalPages} 
                onClick={()=>setPage(p=>Math.min(totalPages,p+1))} 
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Job Details Panel */}
        <div className="xl:col-span-1">
          {selectedJob ? (
            <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-6 sticky top-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-3xl shadow-lg">
                  {selectedJob.logo}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedJob.title}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-green-400 font-semibold">{selectedJob.company}</p>
                    {selectedJob.verified && (
                      <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  { icon: '📍', label: 'Location', value: selectedJob.location },
                  { icon: '💰', label: 'Salary', value: selectedJob.salary },
                  { icon: selectedJob.remote ? '🏠' : '🏢', label: 'Work Type', value: selectedJob.remote ? 'Remote' : 'On-site' },
                  { icon: '⏰', label: 'Job Type', value: selectedJob.type },
                  { icon: '⏱️', label: 'Interview Duration', value: `${resolveInterviewDuration(selectedJob)} minutes` },
                  { icon: '📅', label: 'Posted', value: new Date(selectedJob.postedAt).toLocaleDateString() }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                      <p className="text-sm text-gray-200">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedJob.tags||[]).map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-gray-800/60 text-gray-300 text-xs rounded-lg border border-gray-700/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Job Description</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="space-y-3">
                <button
                  className="w-full bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-500 hover:to-teal-500 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-400/25"
                  onClick={() => handleApplyToJob(selectedJob)}
                  disabled={applying.has(selectedJob._id)}
                >
                  {applying.has(selectedJob._id) ? 'Applying...' : 'Apply Now'}
                </button>
                <button 
                  onClick={() => toggleSave(selectedJob._id)}
                  className={`w-full font-medium py-3 px-4 rounded-xl transition-all backdrop-blur-sm ${
                    saved.has(selectedJob._id)
                      ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                      : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                  }`}
                >
                  {saved.has(selectedJob._id) ? 'Saved ✓' : 'Save for Later'}
                </button>
                <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-medium py-3 px-4 rounded-xl transition-all">
                  Practice Interview for this Role
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-8 text-center sticky top-6 backdrop-blur-sm">
              <div className="text-gray-500 mb-6">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Select a Job</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Click on any job from the list to view detailed information, requirements, and apply directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsView;