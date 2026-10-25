import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, User, FunnelSimple, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Cheese, Review, UserProfile, ViewMode, SortOption, FilterState } from '@/lib/types'
import { CheeseCard } from '@/components/CheeseCard'
import { CheeseDetail } from '@/components/CheeseDetail'
import { AddCheeseDialog } from '@/components/AddCheeseDialog'
import { NicknamePrompt } from '@/components/NicknamePrompt'
import { FilterPanel } from '@/components/FilterPanel'
import { EmptyState } from '@/components/EmptyState'
import { sortCheeses, filterCheeses, searchCheeses, getUniqueValues, generateUserId } from '@/lib/cheese-utils'
import { toast } from 'sonner'

function App() {
  const [cheeses, setCheeses] = useKV<Cheese[]>('cheeses', [])
  const [reviews, setReviews] = useKV<Review[]>('reviews', [])
  const [userProfile, setUserProfile] = useKV<UserProfile>('user-profile', {
    nickname: '',
    triedCheeses: [],
    wishlist: [],
  })

  const [userId] = useState(() => generateUserId())
  const [isOwner, setIsOwner] = useState(false)
  const [selectedCheese, setSelectedCheese] = useState<Cheese | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    origin: [],
    milkType: [],
    texture: [],
    flavorProfile: [],
  })

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const user = await window.spark.user()
        setIsOwner(user?.isOwner || false)
      } catch (error) {
        setIsOwner(false)
      }
    }
    checkOwner()
  }, [])

  useEffect(() => {
    if (userProfile && !userProfile.nickname) {
      const timer = setTimeout(() => {
        setShowNicknamePrompt(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [userProfile])

  const filteredCheeses = useMemo(() => {
    const allCheeses = cheeses || []
    const allReviews = reviews || []
    const profile = userProfile || { nickname: '', triedCheeses: [], wishlist: [] }
    
    let result = [...allCheeses]

    if (viewMode === 'tried') {
      result = result.filter(c => profile.triedCheeses.includes(c.id))
    } else if (viewMode === 'wishlist') {
      result = result.filter(c => profile.wishlist.includes(c.id))
    }

    result = searchCheeses(result, searchQuery)
    result = filterCheeses(result, filters)
    result = sortCheeses(result, allReviews, sortBy)

    return result
  }, [cheeses, reviews, viewMode, sortBy, filters, searchQuery, userProfile])

  const availableFilters = useMemo(() => {
    const allCheeses = cheeses || []
    const baseList = viewMode === 'all' ? allCheeses : filteredCheeses
    return {
      origins: getUniqueValues(baseList, 'origin'),
      milkTypes: getUniqueValues(baseList, 'milkType'),
      textures: getUniqueValues(baseList, 'texture'),
      flavorProfiles: getUniqueValues(baseList, 'flavorProfile'),
    }
  }, [cheeses, viewMode, filteredCheeses])

  const handleAddCheese = (cheeseData: Omit<Cheese, 'id' | 'createdAt'>) => {
    const newCheese: Cheese = {
      ...cheeseData,
      id: `cheese-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    setCheeses(current => [...(current || []), newCheese])
    toast.success(`${newCheese.name} has been added!`)
  }

  const handleToggleWishlist = (cheeseId: string) => {
    setUserProfile(current => {
      const profile = current || { nickname: '', triedCheeses: [], wishlist: [] }
      const isWishlisted = profile.wishlist.includes(cheeseId)
      const newWishlist = isWishlisted
        ? profile.wishlist.filter(id => id !== cheeseId)
        : [...profile.wishlist, cheeseId]

      const allCheeses = cheeses || []
      const cheese = allCheeses.find(c => c.id === cheeseId)
      if (cheese) {
        toast.success(
          isWishlisted
            ? `${cheese.name} removed from wishlist`
            : `${cheese.name} added to wishlist`
        )
      }

      return { ...profile, wishlist: newWishlist }
    })
  }

  const handleSubmitReview = (cheeseId: string, rating: number, notes: string) => {
    const profile = userProfile || { nickname: '', triedCheeses: [], wishlist: [] }
    
    const newReview: Review = {
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cheeseId,
      userId,
      nickname: profile.nickname,
      rating,
      notes,
      createdAt: Date.now(),
    }

    setReviews(current => [...(current || []), newReview])
    setUserProfile(current => {
      const prof = current || { nickname: '', triedCheeses: [], wishlist: [] }
      return {
        ...prof,
        triedCheeses: prof.triedCheeses.includes(cheeseId)
          ? prof.triedCheeses
          : [...prof.triedCheeses, cheeseId],
        wishlist: prof.wishlist.filter(id => id !== cheeseId),
      }
    })

    const allCheeses = cheeses || []
    const cheese = allCheeses.find(c => c.id === cheeseId)
    toast.success(`Review submitted for ${cheese?.name}!`)
  }

  const handleUpdateReview = (reviewId: string, rating: number, notes: string) => {
    setReviews(current =>
      (current || []).map(r =>
        r.id === reviewId
          ? { ...r, rating, notes }
          : r
      )
    )
    toast.success('Review updated!')
  }

  const handleSetNickname = (nickname: string) => {
    setUserProfile(current => ({ ...(current || { triedCheeses: [], wishlist: [] }), nickname }))
    toast.success(`Nickname set to ${nickname}`)
  }

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0)
  const hasActiveSearch = searchQuery.trim().length > 0
  const allCheeses = cheeses || []
  const allReviews = reviews || []
  const profile = userProfile || { nickname: '', triedCheeses: [], wishlist: [] }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">CheeseRater.co.uk</h1>
            <div className="flex items-center gap-2">
              {profile.nickname && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNicknamePrompt(true)}
                >
                  <User size={18} />
                  {profile.nickname}
                </Button>
              )}
              {isOwner && (
                <Button onClick={() => setShowAddDialog(true)} size="sm">
                  <Plus size={18} />
                  Add Cheese
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 py-8">
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search cheeses by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {hasActiveSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="all">All Cheeses</TabsTrigger>
                <TabsTrigger value="tried">
                  My Cheeses {profile.triedCheeses.length > 0 && `(${profile.triedCheeses.length})`}
                </TabsTrigger>
                <TabsTrigger value="wishlist">
                  Wishlist {profile.wishlist.length > 0 && `(${profile.wishlist.length})`}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <FunnelSimple size={18} />
                  Filters {hasActiveFilters && `(${Object.values(filters).flat().length})`}
                </Button>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              availableFilters={availableFilters}
            />
          </div>

          <div className="lg:col-span-3">
            {allCheeses.length === 0 && isOwner && (
              <EmptyState
                icon="🧀"
                title="No Cheeses Yet"
                description="Get started by adding your first cheese to the collection."
                actionLabel="Add Your First Cheese"
                onAction={() => setShowAddDialog(true)}
              />
            )}

            {allCheeses.length === 0 && !isOwner && (
              <EmptyState
                icon="🧀"
                title="Coming Soon"
                description="The cheese collection is being curated. Check back soon!"
              />
            )}

            {allCheeses.length > 0 && filteredCheeses.length === 0 && viewMode === 'tried' && (
              <EmptyState
                icon="🧀"
                title="No Cheeses Tried Yet"
                description="Start exploring and rating cheeses to build your personal collection."
                actionLabel="Browse All Cheeses"
                onAction={() => setViewMode('all')}
              />
            )}

            {allCheeses.length > 0 && filteredCheeses.length === 0 && viewMode === 'wishlist' && (
              <EmptyState
                icon="💛"
                title="Your Wishlist is Empty"
                description="Bookmark cheeses you want to try by clicking the heart icon."
                actionLabel="Browse All Cheeses"
                onAction={() => setViewMode('all')}
              />
            )}

            {allCheeses.length > 0 && filteredCheeses.length === 0 && viewMode === 'all' && (
              <EmptyState
                icon="🔍"
                title="No Matching Cheeses"
                description={
                  hasActiveSearch 
                    ? `No cheeses found matching "${searchQuery}". Try a different search term.`
                    : "Try adjusting your filters to see more results."
                }
                actionLabel={hasActiveSearch ? "Clear Search" : "Clear Filters"}
                onAction={() => {
                  if (hasActiveSearch) {
                    setSearchQuery('')
                  } else {
                    setFilters({ origin: [], milkType: [], texture: [], flavorProfile: [] })
                  }
                }}
              />
            )}

            {filteredCheeses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCheeses.map(cheese => (
                  <CheeseCard
                    key={cheese.id}
                    cheese={cheese}
                    reviews={allReviews}
                    isWishlisted={profile.wishlist.includes(cheese.id)}
                    onToggleWishlist={() => handleToggleWishlist(cheese.id)}
                    onClick={() => setSelectedCheese(cheese)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CheeseDetail
        cheese={selectedCheese}
        open={selectedCheese !== null}
        onOpenChange={(open) => !open && setSelectedCheese(null)}
        reviews={allReviews}
        userId={userId}
        userNickname={profile.nickname}
        isWishlisted={selectedCheese ? profile.wishlist.includes(selectedCheese.id) : false}
        onToggleWishlist={() => selectedCheese && handleToggleWishlist(selectedCheese.id)}
        onSubmitReview={(rating, notes) =>
          selectedCheese && handleSubmitReview(selectedCheese.id, rating, notes)
        }
        onUpdateReview={handleUpdateReview}
        onNicknamePrompt={() => setShowNicknamePrompt(true)}
      />

      {isOwner && (
        <AddCheeseDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleAddCheese}
        />
      )}

      <NicknamePrompt
        open={showNicknamePrompt}
        onOpenChange={setShowNicknamePrompt}
        onSubmit={handleSetNickname}
        currentNickname={profile.nickname}
      />
    </div>
  )
}

export default App