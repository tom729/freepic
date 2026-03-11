# components/AGENTS.md

React components for FreePic image sharing platform.

## Component Inventory

| Component                          | Lines | Type   | Purpose                                                    |
| ---------------------------------- | ----- | ------ | ---------------------------------------------------------- |
| `ImageCard.tsx`                    | 247   | Client | Image thumbnail with progressive loading, overlay metadata |
| `MasonryGallery.tsx`               | 252   | Client | Infinite scroll masonry grid (homepage)                    |
| `ImageGrid.tsx`                    | 192   | Client | Configurable image grid with load-more button              |
| `Lightbox.tsx`                     | 311   | Client | Fullscreen image viewer with keyboard/nav                  |
| `TagInput.tsx`                     | 155   | Client | Autocomplete tag input with suggestions                    |
| `Header.tsx`                       | 222   | Client | Navigation header with auth state                          |
| `Footer.tsx`                       | 142   | Server | Site footer with links grid                                |
| `HeroSection.tsx`                  | 89    | Client | Homepage hero with search                                  |
| `CollectionsSection.tsx`           | 177   | Client | Horizontal scrolling collections carousel                  |
| `FeaturedPhotographersSection.tsx` | 108   | Server | Top photographers grid (DB query)                          |
| `StatisticsSection.tsx`            | ~100  | Server | Platform stats display                                     |
| `MobileMenu.tsx`                   | ~80   | Client | Responsive mobile navigation                               |
| `ImageModal.tsx`                   | ~90   | Client | Modal wrapper for image detail                             |

## Where to Look

| Task                     | File                              |
| ------------------------ | --------------------------------- |
| Change image card design | `ImageCard.tsx`                   |
| Add new gallery view     | Extend `ImageGrid.tsx`            |
| Modify lightbox behavior | `Lightbox.tsx`                    |
| Update tag input logic   | `TagInput.tsx`                    |
| Change header navigation | `Header.tsx`                      |
| Update homepage sections | `HeroSection.tsx`, `*Section.tsx` |
| Add new form input       | Create new client component       |

## Component Patterns

### Client vs Server

- **Client components**: Interactivity (galleries, lightbox, forms, inputs)
- **Server components**: Static data display (footer, featured photographers, stats)

### Image Handling

- External images (Unsplash): Use `next/image`
- Local images: Use `img` element with `dangerouslySetInnerHTML` pattern
- Progressive loading: Dominant color → blur → full image

### State Management

- Local state: `useState` for UI state
- Global state: Zustand stores in `@/stores/`
- Server data: Fetch in `useEffect` or directly in Server Components

## Anti-Patterns

- **Do not** import client components into server components unnecessarily
- **Do not** use `as any` for event handlers (type them properly)
- **Do not** forget `key` props in mapped lists
- **Do not** put database queries in client components
- **Do not** mix server and client data fetching patterns — use Server Components for initial data, Client Components for user interactions
