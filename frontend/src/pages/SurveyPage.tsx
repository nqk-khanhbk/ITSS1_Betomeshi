import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import {
  EXPERIENCE_OPTIONS,
  SMELL_OPTIONS,
  TASTE_PREFERENCE_OPTIONS,
  ALLERGY_OPTIONS,
  type ExperienceOption,
  type SmellOption,
  type TastePreferenceOption,
  type AllergyOption,
} from '@/types/preferences';

function toggleCheckbox<T extends string>(
  value: T,
  currentList: T[],
  setter: React.Dispatch<React.SetStateAction<T[]>>
) {
  if (currentList.includes(value)) {
    setter(currentList.filter(item => item !== value));
  } else {
    setter([...currentList, value]);
  }
}

export default function SurveyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  // Form state matching preferenceModel.js
  const [targetName, setTargetName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceOption | ''>('');
  const [smellTolerance, setSmellTolerance] = useState<SmellOption | ''>('');
  const [tastePreferences, setTastePreferences] = useState<TastePreferenceOption[]>([]);
  const [allergies, setAllergies] = useState<AllergyOption[]>([]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  const savePreferences = async (silent = false) => {
    const preferences = {
      target_name: targetName.trim(),
      experience_level: experienceLevel,
      smell_tolerance: smellTolerance,
      taste_preference: tastePreferences,
      allergies: allergies.filter(a => a !== 'none'), // Remove 'none' if other items selected
    };

    try {
      await api.post('/preferences', preferences);
      if (!silent) {
        alert(t('profilePage.saveSuccess'));
      }
      return true;
    } catch (error) {
      console.error("Save error", error);
      if (!silent) {
        alert(t('profilePage.saveFailed'));
      }
      return false;
    }
  };

  const handleSave = async () => {
    const success = await savePreferences(false);
    if (success) {
      navigate('/');
    }
  };

  const handleSearch = async () => {
    await savePreferences(true);

    // Build filter params based on preferences for the filter-by-preference API
    const params = new URLSearchParams();

    // Required: target_name for filtering
    if (targetName.trim()) {
      params.set('target_name', targetName.trim());
    } else {
      params.set('target_name', 'default');
    }

    // Map taste preferences to japanese_similar for backend filtering
    if (tastePreferences.length > 0) {
      params.set('japanese_similar', tastePreferences.join(','));
    }

    // Pass experience level for filtering logic
    if (experienceLevel) params.set('experience', experienceLevel);

    // Pass smell tolerance for filtering logic
    if (smellTolerance) params.set('smell', smellTolerance);

    // Pass allergies to exclude foods
    if (allergies.length > 0 && !allergies.includes('none')) {
      params.set('allergies', allergies.join(','));
    }

    // Use filter mode to tell MenuPage to use preference-based filtering
    params.set('filter_mode', 'preference');

    navigate(`/foods?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#faf9f7] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="py-6 text-center relative">
          <h1 className="text-3xl font-bold text-[#ad343e] flex items-center justify-center gap-2">
            <span role="img" aria-label="sushi">🍣</span> {t('survey.title')}
          </h1>
          <button onClick={() => navigate('/')} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-8">
          {/* Target Person */}
          <div className="mb-8 p-4">
            <label className="block text-gray-700 font-semibold mb-2">{t('survey.target')}</label>
            <input
              type="text"
              placeholder={t('survey.targetPlaceholder')}
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#ad343e]/50"
            />
          </div>

          <div className="space-y-8">

            {/* Q1: Experience Level */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">{t('survey.q1')}</p>
              <div className="grid grid-cols-1 gap-3">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                    <input
                      type="radio"
                      name="experience"
                      className="w-5 h-5 accent-[#ad343e]"
                      checked={experienceLevel === opt}
                      onChange={() => setExperienceLevel(opt)}
                    />
                    <span className="text-gray-700">{t(`survey.options.${opt}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q2: Smell Tolerance */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">{t('survey.q2')}</p>
              <div className="grid grid-cols-1 gap-3">
                {SMELL_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                    <input
                      type="radio"
                      name="smell"
                      className="w-5 h-5 accent-[#ad343e]"
                      checked={smellTolerance === opt}
                      onChange={() => setSmellTolerance(opt)}
                    />
                    <span className="text-gray-700">{t(`survey.options.${opt}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q3: Taste Preference (Japanese food comparison) */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">{t('survey.q3')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TASTE_PREFERENCE_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#ad343e] rounded"
                      checked={tastePreferences.includes(opt)}
                      onChange={() => toggleCheckbox(opt, tastePreferences, setTastePreferences)}
                    />
                    <span className="text-gray-700">{t(`survey.options.${opt}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q4: Allergies */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">{t('survey.q4')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALLERGY_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#ad343e] rounded"
                      checked={allergies.includes(opt)}
                      onChange={() => {
                        if (opt === 'none') {
                          // If clicking "none", clear all others
                          setAllergies(allergies.includes('none') ? [] : ['none']);
                        } else {
                          // If clicking another option, remove "none"
                          const withoutNone = allergies.filter(a => a !== 'none');
                          if (withoutNone.includes(opt)) {
                            setAllergies(withoutNone.filter(a => a !== opt));
                          } else {
                            setAllergies([...withoutNone, opt]);
                          }
                        }
                      }}
                    />
                    <span className="text-gray-700">{t(`survey.options.${opt}`)}</span>
                  </label>
                ))}
              </div>
              <div className="border-b border-gray-200 mt-8"></div>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="mt-10 py-6 flex flex-col sm:flex-row gap-6 justify-between items-center border-t border-gray-100">
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto bg-[#d65b20] hover:bg-[#ad343e] text-white text-lg px-12 py-6 rounded-md shadow-md"
            >
              {t('survey.save')}
            </Button>

            <Button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-[#d65b20] hover:bg-[#ad343e] text-white text-lg px-12 py-6 rounded-md shadow-md"
            >
              {t('survey.search')}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}