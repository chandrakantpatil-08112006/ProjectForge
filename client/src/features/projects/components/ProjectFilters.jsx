import { X } from 'lucide-react';
import SkillPicker from '../../../components/common/SkillPicker.jsx';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import { DIFFICULTIES, EXPLORE_STATUS_OPTIONS, PROJECT_CATEGORIES } from '../../../lib/constants.js';

/** Filter panel for Explore. Fully controlled: the URL is the source of truth. */
export default function ProjectFilters({ values, skills, onChange, onSkillsChange, onClear, activeCount }) {
  return (
    <div className="space-y-5 rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear ({activeCount})
          </Button>
        )}
      </div>

      <Select label="Category" value={values.category} onChange={(e) => onChange({ category: e.target.value })}>
        <option value="">All categories</option>
        {PROJECT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </Select>

      <Select label="Difficulty" value={values.difficulty} onChange={(e) => onChange({ difficulty: e.target.value })}>
        <option value="">Any difficulty</option>
        {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </Select>

      <Select label="Status" value={values.status} onChange={(e) => onChange({ status: e.target.value })}>
        {EXPLORE_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </Select>

      <div className="space-y-2">
        <SkillPicker label="Skills" compact value={skills} onChange={onSkillsChange} max={10} />
        {skills.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.match === 'all'}
              onChange={(e) => onChange({ match: e.target.checked ? 'all' : 'any' })}
              className="h-4 w-4 rounded border-line accent-brand-600"
            />
            Must require all selected skills
          </label>
        )}
      </div>
    </div>
  );
}
