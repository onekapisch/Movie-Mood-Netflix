import UserPreferencesForm from "./user-preferences-form"
import GroupWatchCreator from "./group-watch-creator"
import AdvancedFilters from "./advanced-filters"
import SmartWatchlist from "./smart-watchlist"
import ViewingAnalytics from "./viewing-analytics"
import ContentAnalysis from "./content-analysis"
import MoodPicker from "./mood-picker"

export default function Page() {
  const handleMoodSelect = (mood: string, energy: string, contentLength: number) => {
    console.log("Selected mood:", mood)
    console.log("Selected energy:", energy)
    console.log("Content length:", contentLength)
    // In a real app, you would use this data to fetch recommendations
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Netflix Picker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
          <UserPreferencesForm />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Group Watch</h2>
          <GroupWatchCreator />
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Mood-Based Recommendations</h2>
        <MoodPicker onMoodSelect={handleMoodSelect} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Advanced Filters</h2>
        <AdvancedFilters onFilterChange={(filters) => console.log(filters)} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Smart Watchlist</h2>
        <SmartWatchlist />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Viewing Analytics</h2>
        <ViewingAnalytics />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Content Analysis Example</h2>
        <ContentAnalysis
          movieId={550}
          title="Fight Club"
          overview="A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground 'fight clubs' forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion."
          genres={["Drama", "Thriller"]}
        />
      </div>
    </div>
  )
}
