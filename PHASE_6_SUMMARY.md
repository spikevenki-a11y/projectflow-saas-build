# Phase 6: Search, Views & Performance

Phase 6 completes the pragmatic route project manager with comprehensive search, multiple task views, and enterprise compliance features.

## Database Enhancements

### Audit Logs (`audit_logs` table)
- Tracks all create, update, delete operations on tasks and comments
- Stores resource type, user, action, and JSON change diff
- Automatic triggers on tasks and comments tables
- RLS policies ensure org members can only see their org's audit logs
- Indexes on org_id, user_id, resource_id, and created_at for fast retrieval

### View Preferences (`view_preferences` table)
- Per-user settings for task view type (list, board, calendar)
- Sorting options: created_at, due_date, priority, status
- Support for custom filters and sort order (asc/desc)
- Project-specific preferences with org/user scoping
- Unique constraint on (org_id, user_id, project_id) for easy upserts

### Full-Text Search
- Added searchable `search_text` tsvector column to tasks
- Weights task title (A) higher than description (B)
- GIN index for fast full-text search queries
- PostgreSQL English stemming for intelligent searching

## Server Infrastructure

### Search Utilities (`lib/search.ts`)
- `searchTasks()`: Full-text search with pagination, status/priority/assignee filters
- `getTaskSuggestions()`: Autocomplete suggestions for search bar
- `getPopularSearches()`: Popular task titles for recommendations
- Respects organization boundaries via RLS

### View Preferences Utilities (`lib/view-preferences.ts`)
- `getViewPreference()`: Fetch user's saved view settings
- `saveViewPreference()`: Upsert view preferences with auto defaults
- `getDefaultViewPreference()`: Provide sensible defaults
- Fully typed with ViewType, SortBy enums

## API Routes

### `/api/search` (GET)
- Query parameter: `q` (search query)
- Type parameter: `search` | `suggestions`
- Supports pagination: `limit`, `offset`
- Returns: `{ tasks, total }` or `{ suggestions }`

### `/api/view-preferences` (GET/POST)
- GET: Fetch current view preferences for a project
- POST: Save or update view preferences
- Automatic org/user scoping via auth
- Upsert semantics for simple updates

## UI Components

### SearchBar (`components/dashboard/search-bar.tsx`)
- Autocomplete suggestions with debounced search
- Dropdown displays matching tasks with quick select
- Click outside to close
- Enter key to search (future: global search page)
- Integrated with SWR for caching

### TaskViewToggle (`components/dashboard/task-view-toggle.tsx`)
- Three view mode buttons: List, Board, Calendar
- Icons from lucide-react
- Active state highlighting
- Responsive (labels hidden on mobile)

### TaskListView (`components/dashboard/task-list-view.tsx`)
- Tasks grouped by status (Todo, In Progress, Completed)
- Collapsible status sections with task count
- Reuses existing TaskCard component
- Loading state with spinner

### TaskBoardView (`components/dashboard/task-board-view.tsx`)
- Kanban-style board with three columns
- Color-coded columns (gray, blue, green)
- Task counts per column
- Responsive grid layout

### TaskCalendarView (`components/dashboard/task-calendar-view.tsx`)
- Monthly calendar grid
- Shows tasks on their due dates
- Navigate between months
- Highlight today's date
- Clickable task pills for quick access

## Security & Performance

### RLS Enforcement
- Audit logs visible only to org members
- View preferences isolated to individual users
- Search respects org membership
- All queries enforce org scoping

### Performance Optimizations
- Debounced search (300ms) to reduce query load
- SWR caching on suggestions to avoid duplicate requests
- Pagination support (default 10 items per page)
- GIN indexes on full-text search columns
- Database indexes on common filter columns

### Compliance
- Full audit trail of all task/comment changes
- User-attributed changes for accountability
- JSON diffs stored for detailed audit analysis
- Automated triggers ensure no operations bypass logging

## Integration Points

### Existing Components
- SearchBar integrates with existing dashboard
- View components use existing TaskCard component
- All hooks follow project conventions

### Future Extensibility
- View preferences can expand to include more filter types
- Audit logs can be exported for compliance reports
- Search can be extended to include comments, projects
- Calendar view can support drag-drop reassignment

## Summary

Phase 6 provides enterprise-grade search, multiple task visualization modes, and complete audit compliance. Organizations can now search across thousands of tasks efficiently, view work in their preferred format, and maintain detailed audit trails for compliance requirements.
