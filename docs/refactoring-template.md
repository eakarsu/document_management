# Refactoring Template & Pattern Guide

## Quick Refactoring Pattern

### Step 1: Analyze the File Structure
Identify these key sections in each large file:
- **Types & Interfaces** → Extract to `types.ts`
- **Constants & Config** → Extract to `config.ts`
- **Utility Functions** → Extract to `utils.ts`
- **Custom Hooks** → Extract to `use[Name].ts`
- **API Calls** → Extract to `services/[name]Service.ts`
- **Components** → Extract to separate component files
- **Business Logic** → Extract to `handlers/[name]Handler.ts`

### Step 2: File Organization Structure

```
src/
├── components/
│   └── [feature-name]/
│       ├── types.ts              (50-100 lines)
│       ├── config.ts             (20-50 lines)
│       ├── utils.ts              (50-200 lines)
│       ├── use[Feature].ts       (100-300 lines)
│       ├── [Feature]Header.tsx   (100-200 lines)
│       ├── [Feature]Body.tsx     (200-400 lines)
│       ├── [Feature]Footer.tsx   (100-200 lines)
│       └── index.tsx             (Main component, 200-500 lines)
```

### Step 3: Refactoring Commands

```bash
# 1. Create backup
cp [original-file] [original-file].original

# 2. Create component directory
mkdir -p src/components/[feature-name]

# 3. Create refactored files
touch src/components/[feature-name]/{types.ts,config.ts,utils.ts,index.tsx}
```

## Frontend Component Refactoring Pattern

### Original Structure (Before):
```typescript
// page.tsx (3000+ lines)
const LargeComponent = () => {
  // 100+ lines of state
  // 50+ handlers
  // 500+ lines of JSX
  // Mixed business logic
}
```

### Refactored Structure (After):

#### `types.ts`
```typescript
export interface ComponentState {
  // All interfaces and types
}
```

#### `config.ts`
```typescript
export const DEFAULT_VALUES = {
  // All constants and configurations
}
```

#### `use[Feature].ts` (Main Hook)
```typescript
export const useFeature = (id: string) => {
  // State management
  // API calls
  // Core business logic

  return {
    state,
    handlers,
    loading,
    error
  };
}
```

#### `use[Feature]Handlers.ts` (Event Handlers)
```typescript
export const useFeatureHandlers = (state, setState) => {
  const handleSave = () => { /* ... */ };
  const handleDelete = () => { /* ... */ };

  return { handleSave, handleDelete };
}
```

#### `[Feature]Header.tsx`
```typescript
export const FeatureHeader: React.FC<HeaderProps> = ({ title, onSave }) => {
  return <AppBar>...</AppBar>;
}
```

#### `index.tsx` (Main Component)
```typescript
import { useFeature } from './useFeature';
import { useFeatureHandlers } from './useFeatureHandlers';
import { FeatureHeader } from './FeatureHeader';
import { FeatureBody } from './FeatureBody';

export const Feature = () => {
  const { state, loading } = useFeature(id);
  const handlers = useFeatureHandlers(state, setState);

  if (loading) return <Loading />;

  return (
    <>
      <FeatureHeader {...headerProps} />
      <FeatureBody {...bodyProps} />
    </>
  );
}
```

## Backend Service Refactoring Pattern

### Original Structure (Before):
```typescript
// service.ts (2000+ lines)
export class LargeService {
  // 30+ methods
  // Mixed responsibilities
  // Database, API, business logic all together
}
```

### Refactored Structure (After):

#### `types.ts`
```typescript
export interface ServiceRequest {}
export interface ServiceResponse {}
```

#### `repository.ts` (Data Layer)
```typescript
export class FeatureRepository {
  async findById(id: string) { /* ... */ }
  async create(data: any) { /* ... */ }
  async update(id: string, data: any) { /* ... */ }
}
```

#### `validator.ts` (Validation)
```typescript
export class FeatureValidator {
  validateCreate(data: any) { /* ... */ }
  validateUpdate(data: any) { /* ... */ }
}
```

#### `transformer.ts` (Data Transformation)
```typescript
export class FeatureTransformer {
  toDTO(entity: any) { /* ... */ }
  toEntity(dto: any) { /* ... */ }
}
```

#### `service.ts` (Business Logic)
```typescript
export class FeatureService {
  constructor(
    private repository: FeatureRepository,
    private validator: FeatureValidator,
    private transformer: FeatureTransformer
  ) {}

  async process(data: any) {
    this.validator.validateCreate(data);
    const entity = this.transformer.toEntity(data);
    const result = await this.repository.create(entity);
    return this.transformer.toDTO(result);
  }
}
```

## Quick Refactoring Checklist

### For Each Large File:
- [ ] Create backup (.original)
- [ ] Identify logical sections
- [ ] Extract types/interfaces
- [ ] Extract constants/config
- [ ] Extract utility functions
- [ ] Extract API/service calls
- [ ] Split large components into smaller ones
- [ ] Create custom hooks for state logic
- [ ] Test that functionality is preserved
- [ ] Replace original with refactored version
- [ ] Update imports in other files

## Automated Extraction Patterns

### Extract All Interfaces:
```bash
grep -n "interface\|type.*=" [file] > interfaces.txt
```

### Extract All Functions:
```bash
grep -n "const.*=.*(" [file] > functions.txt
```

### Extract All useState/useEffect:
```bash
grep -n "useState\|useEffect" [file] > hooks.txt
```

## File Size Guidelines

- **Main Component/Service**: 200-500 lines
- **Sub-components**: 100-300 lines
- **Hooks**: 100-300 lines
- **Utils**: 50-200 lines
- **Types**: 50-150 lines
- **Config**: 20-100 lines

## Common Refactoring Targets

### 1. Extract Form Handling
```typescript
// Before: Mixed in component
// After: useFormHandler.ts
export const useFormHandler = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const handleChange = () => {};
  const handleSubmit = () => {};
  return { values, handleChange, handleSubmit };
}
```

### 2. Extract API Calls
```typescript
// Before: Mixed in component
// After: api/featureApi.ts
export const featureApi = {
  getAll: () => fetch('/api/features'),
  getById: (id) => fetch(`/api/features/${id}`),
  create: (data) => fetch('/api/features', { method: 'POST', body: data }),
}
```

### 3. Extract Complex Render Logic
```typescript
// Before: 500 lines of JSX
// After: Multiple components
<FeatureHeader />
<FeatureFilters />
<FeatureTable />
<FeaturePagination />
```

## Benefits After Refactoring

1. **Maintainability**: Each file has single responsibility
2. **Testability**: Easier to unit test individual functions
3. **Reusability**: Components and hooks can be reused
4. **Performance**: Potential for better code splitting
5. **Readability**: Easier to understand and navigate
6. **Team Collaboration**: Multiple developers can work on different parts

## Quick Start Commands

```bash
# For frontend component
mkdir -p src/components/[name] && \
touch src/components/[name]/{types.ts,utils.ts,config.ts,use[Name].ts,index.tsx}

# For backend service
mkdir -p src/services/[name] && \
touch src/services/[name]/{types.ts,repository.ts,validator.ts,service.ts,index.ts}
```