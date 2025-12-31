import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VetDirectory() {
  const navigate = useNavigate();
  const [vets, setVets] = useState([]);
  const [filteredVets, setFilteredVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchVets();
  }, []);

  useEffect(() => {
    filterVets();
  }, [vets, searchQuery, specialtyFilter, locationFilter]);

  const fetchVets = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/vets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVets(data);
        setFilteredVets(data);
      }
    } catch (error) {
      console.error('Error fetching vets:', error);
    }
  };

  const filterVets = () => {
    let filtered = vets;

    if (searchQuery) {
      filtered = filtered.filter(vet =>
        vet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vet.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (specialtyFilter) {
      filtered = filtered.filter(vet =>
        vet.specialty?.toLowerCase().includes(specialtyFilter.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(vet =>
        vet.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredVets(filtered);
  };

  return (
    <div className="min-h-screen bg-eggshell">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-clay font-semibold mb-4 hover:underline"
          >
            ← Back to Dashboard
          </button>
          <h1 className="font-heading text-4xl font-bold text-deepblue mb-2">
            Find a Vet
          </h1>
          <p className="text-[#787A91]">Search for veterinarians in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#787A91]" />
              <input
                data-testid="input-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or specialty"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none"
              />
            </div>
            <input
              data-testid="input-specialty"
              type="text"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              placeholder="Filter by specialty"
              className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none"
            />
            <input
              data-testid="input-location"
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location"
              className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none"
            />
          </div>
        </div>

        {/* Vets Grid */}
        {filteredVets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-soft">
            <p className="text-[#787A91]">No vets found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredVets.map((vet) => (
              <div
                key={vet.user_id}
                onClick={() => navigate(`/vets/${vet.user_id}`)}
                className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all cursor-pointer"
                data-testid={`vet-card-${vet.user_id}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-sage/10 border-2 border-sage overflow-hidden flex items-center justify-center">
                    {vet.picture ? (
                      <img src={vet.picture} alt={vet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-sage">
                        {vet.name?.[0] || 'V'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-deepblue">Dr. {vet.name}</h3>
                    <p className="text-sm text-[#787A91]">{vet.specialty}</p>
                  </div>
                </div>
                <p className="text-sm text-[#787A91] mb-2">
                  📍 {vet.location}
                </p>
                <p className="text-sm text-[#787A91] mb-3">
                  {vet.experience_years} years experience
                </p>
                {vet.bio && (
                  <p className="text-sm text-[#787A91] line-clamp-2">{vet.bio}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
