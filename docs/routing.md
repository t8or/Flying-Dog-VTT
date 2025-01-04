# Application Routing

## Overview

The application uses React Router v6 for client-side routing. The routing system is designed to provide a seamless navigation experience while maintaining proper access control and state management.

## Route Structure

```
/                           # Home page
├── /maps                   # Maps list
│   └── /:id               # Individual map view
├── /combat                # Combat tracker
│   └── /history          # Combat history
├── /timeline             # Campaign timeline
└── /log                  # Activity log
```

## Route Definitions

### Main Router Setup
```javascript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="maps" element={<Maps />}>
        <Route path=":id" element={<MapDetail />} />
      </Route>
      <Route path="combat" element={<CombatTracker />} />
      <Route path="combat/history" element={<History />} />
      <Route path="timeline" element={<Timeline />} />
      <Route path="log" element={<Log />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>
```

## Route Components

### Layout Component
```javascript
const Layout = () => {
  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};
```

### Route Guards
```javascript
const ProtectedRoute = ({ children }) => {
  const { campaign } = useCampaign();
  const location = useLocation();

  if (!campaign) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
```

## Navigation Flow

### Standard Navigation
```javascript
const navigate = useNavigate();

// Programmatic navigation
const handleMapSelect = (mapId) => {
  navigate(`/maps/${mapId}`);
};

// Link-based navigation
<Link to="/combat">Combat Tracker</Link>
```

### Modal Routes
```javascript
// Modal route setup
<Routes>
  <Route path="/maps/:id">
    <Route path="edit" element={<MapEditModal />} />
    <Route path="share" element={<ShareModal />} />
  </Route>
</Routes>

// Modal navigation
const location = useLocation();
const background = location.state?.background;

{background && (
  <Routes>
    <Route path="/maps/:id/edit" element={<MapEditModal />} />
  </Routes>
)}
```

## Route Parameters

### URL Parameters
```javascript
// Route definition
<Route path="/maps/:id" element={<MapDetail />} />

// Parameter usage
const { id } = useParams();
```

### Query Parameters
```javascript
// Setting query parameters
navigate({
  pathname: '/maps',
  search: '?sort=name&filter=recent'
});

// Reading query parameters
const [searchParams] = useSearchParams();
const sort = searchParams.get('sort');
```

## State Management

### Location State
```javascript
// Setting location state
navigate('/maps', { 
  state: { 
    previousPath: location.pathname 
  }
});

// Accessing location state
const location = useLocation();
const { previousPath } = location.state || {};
```

### Navigation State
```javascript
// Navigation with state
navigate('/combat', {
  state: { 
    initiateCombat: true,
    participants: selectedParticipants 
  }
});
```

## Route Transitions

### Loading States
```javascript
const MapDetail = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchMapDetails(id)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <LoadingSpinner />;
  return <MapView />;
};
```

### Error Boundaries
```javascript
const RouteErrorBoundary = () => {
  const error = useRouteError();
  
  return (
    <div className="error-container">
      <h1>Oops!</h1>
      <p>{error.message}</p>
    </div>
  );
};
```

## Access Control

### Route Protection
```javascript
const routes = [
  {
    path: '/',
    element: <Home />,
    public: true
  },
  {
    path: '/maps',
    element: <Maps />,
    requiresCampaign: true
  }
];

const renderRoute = (route) => {
  if (route.public) return route.element;
  if (route.requiresCampaign) {
    return (
      <RequireCampaign>
        {route.element}
      </RequireCampaign>
    );
  }
  return <ProtectedRoute>{route.element}</ProtectedRoute>;
};
```

### Permission Checks
```javascript
const MapActions = () => {
  const { campaign } = useCampaign();
  const { permissions } = usePermissions();

  return (
    <div className="actions">
      {permissions.canEdit && (
        <button onClick={handleEdit}>Edit</button>
      )}
      {permissions.canDelete && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
};
```

## History Management

### Browser History
```javascript
const handleBack = () => {
  if (canGoBack) {
    navigate(-1);
  } else {
    navigate('/');
  }
};
```

### Custom History
```javascript
const navigationHistory = {
  stack: [],
  push: (path) => {
    navigationHistory.stack.push(path);
  },
  pop: () => {
    return navigationHistory.stack.pop();
  }
};
```

## Development Tools

### Route Debugging
```javascript
const RouteDebugger = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  console.log({
    pathname: location.pathname,
    params,
    query: Object.fromEntries(searchParams)
  });

  return null;
};
```

### Navigation Events
```javascript
useEffect(() => {
  const unsubscribe = navigation.subscribe((event) => {
    analytics.trackPageView(event.location.pathname);
  });

  return unsubscribe;
}, [navigation]);
``` 