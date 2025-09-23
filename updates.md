# Interactive Presentation Tool - Enhanced Implementation Plan

## Overview - Team Collaboration Priority
This comprehensive plan prioritizes **team collaboration** and **Google Workspace integration**:
1. **Development Infrastructure** - Testing, linting, CI/CD, and code quality
2. **Mobile/Touch Optimization** - Touch gestures, responsive design
3. **Google Drive/Sheets Backend** - Project saving, sharing, and collaboration
4. **Team Collaboration Features** - Real-time editing, sharing, version control
5. **Export Functionality** - JSON, PDF, video recording capabilities  
6. **Text Overlays** - Clickable text annotations with timing
7. **Media Upload/Capture** - Camera integration and file upload
8. **Advanced Features** - Templates, analytics, offline support

---

## Phase 2: Google Drive/Sheets Backend Integration

### Task 2.1: Google Workspace Authentication & Permissions
**Files**: `utils/googleAuth.ts`, `hooks/useGoogleAuth.ts`

**Implementation**:
- [ ] Set up Google OAuth 2.0 with appropriate scopes
- [ ] Implement Google API client initialization
- [ ] Add organization-wide authentication flow
- [ ] Configure domain restrictions for enterprise security
- [ ] Handle token refresh and session management

**Required Google API Scopes**:
```typescript
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',           // Create and access app files
  'https://www.googleapis.com/auth/drive.metadata.readonly', // Read file metadata
  'https://www.googleapis.com/auth/spreadsheets',         // Read/write spreadsheets
  'https://www.googleapis.com/auth/userinfo.profile',     // User profile info
  'https://www.googleapis.com/auth/userinfo.email'       // User email for identification
];

interface GoogleAuthConfig {
  clientId: string;
  organizationDomain?: string; // Restrict to company domain
  forceAccountSelection: boolean;
  hostedDomain?: string; // GSuite domain restriction
}
```

**Success Criteria**:
- ✅ Single sign-on works with organization Google accounts
- ✅ Token refresh happens automatically without user intervention
- ✅ Authentication respects organization security policies
- ✅ Graceful handling of auth failures and revoked permissions
- ✅ User can easily switch between different Google accounts

### Task 2.2: Google Sheets as Collaboration Database
**Files**: `utils/sheetsDB.ts`, `types/collaboration.ts`

**Implementation**:
- [ ] Create master spreadsheet for project metadata
- [ ] Set up real-time collaboration tracking
- [ ] Implement user presence and activity logging
- [ ] Create project sharing and permissions system
- [ ] Add version history tracking in sheets

**Integration with Existing Google Sheets Connector**:
```typescript
import { GoogleSheets } from '../path-to-existing-connector';

class CollaborationSheetsDB {
  private sheets: GoogleSheets;
  private masterSpreadsheetId: string;

  constructor() {
    this.sheets = new GoogleSheets();
    this.masterSpreadsheetId = process.env.COLLABORATION_SPREADSHEET_ID!;
  }

  async initializeCollaborationSheets(): Promise<void> {
    // Create the master collaboration spreadsheet if it doesn't exist
    try {
      await this.sheets.getSpreadsheetById(this.masterSpreadsheetId);
    } catch (error) {
      // Spreadsheet doesn't exist, create it
      await this.sheets.createSpreadsheet('Interactive Presentations - Collaboration Master');
      
      // Set up the required sheets and headers
      await this.setupProjectsSheet();
      await this.setupActivitySheet();
      await this.setupVersionsSheet();
    }
  }

  private async setupProjectsSheet(): Promise<void> {
    const headers = [
      'Project ID', 'Title', 'Description', 'Owner', 'Collaborators', 
      'Drive File ID', 'Created At', 'Updated At', 'Status', 'Permissions'
    ];
    
    await this.sheets.addSingleRow({
      instruction: `Add headers to Projects sheet: ${headers.join(', ')}`
    });
  }

  async createProject(project: Omit<ProjectRecord, 'projectId'>): Promise<string> {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.sheets.addSingleRow({
      instruction: `Add new project to Projects sheet with values: ${projectId}, ${project.title}, ${project.description}, ${project.owner}, ${project.collaborators}, ${project.driveFileId}, ${new Date().toISOString()}, ${new Date().toISOString()}, active, ${project.permissions}`
    });

    return projectId;
  }

  async getUserProjects(userEmail: string): Promise<ProjectRecord[]> {
    const projectsData = await this.sheets.getValuesInRange({
      instruction: `Get all rows from Projects sheet where owner equals '${userEmail}' OR collaborators contains '${userEmail}'`
    });

    // Convert sheet data to ProjectRecord objects
    return this.parseProjectsFromSheetData(projectsData);
  }

  async updateProjectActivity(activity: ActivityRecord): Promise<void> {
    await this.sheets.addSingleRow({
      instruction: `Add activity to Activity sheet: ${activity.timestamp}, ${activity.projectId}, ${activity.userId}, ${activity.action}, ${activity.slideIndex || ''}, ${activity.details}`
    });
  }
}
```

**Google Sheets Database Schema**:
```typescript
// Sheet 1: "Projects" - Master project list
interface ProjectRecord {
  projectId: string;           // A2, A3, A4...
  title: string;              // B2, B3, B4...
  description: string;        // C2, C3, C4...
  owner: string;              // D2, D3, D4... (email)
  collaborators: string;      // E2, E3, E4... (comma-separated emails)
  driveFileId: string;        // F2, F3, F4... (Google Drive file ID)
  createdAt: string;          // G2, G3, G4... (ISO timestamp)
  updatedAt: string;          // H2, H3, H4... (ISO timestamp)
  status: 'active' | 'archived'; // I2, I3, I4...
  permissions: string;        // J2, J3, J4... (view,comment,edit)
}

// Sheet 2: "Activity" - Real-time collaboration tracking
interface ActivityRecord {
  timestamp: string;          // A2, A3, A4...
  projectId: string;          // B2, B3, B4...
  userId: string;             // C2, C3, C4... (email)
  action: string;             // D2, D3, D4... (opened,edited,closed)
  slideIndex?: number;        // E2, E3, E4...
  details: string;            // F2, F3, F4... (JSON string)
}

// Sheet 3: "Versions" - Version history
interface VersionRecord {
  versionId: string;          // A2, A3, A4...
  projectId: string;          // B2, B3, B4...
  driveFileId: string;        // C2, C3, C4... (backup file)
  author: string;             // D2, D3, D4...
  timestamp: string;          // E2, E3, E4...
  description: string;        // F2, F3, F4...
  changesSummary: string;     // G2, G3, G4... (slides added/modified/deleted)
}
```

**Success Criteria**:
- ✅ Project metadata syncs reliably with Google Sheets
- ✅ Multiple users can collaborate without data corruption
- ✅ Activity tracking captures all meaningful user actions
- ✅ Version history is maintained automatically
- ✅ Permissions system enforces access controls

### Task 2.3: Google Drive File Storage & Organization
**Files**: `utils/driveStorage.ts`, `hooks/useDriveSync.ts`

**Implementation**:
- [ ] Create dedicated folder structure for organization presentations
- [ ] Implement automatic file backup and versioning
- [ ] Add media file storage and organization
- [ ] Create presentation templates in shared drives
- [ ] Implement conflict resolution for simultaneous edits

**Integration with Existing Google Drive Connector**:
```typescript
import { google_drive_search, google_drive_fetch } from '../path-to-existing-connector';

class DriveStorageManager {
  private organizationFolderId: string;

  constructor() {
    this.organizationFolderId = process.env.PRESENTATIONS_FOLDER_ID!;
  }

  async savePresentation(
    projectId: string, 
    presentationData: PresentationData,
    isNewVersion: boolean = false
  ): Promise<string> {
    const fileName = isNewVersion 
      ? `${projectId}_v${Date.now()}.json`
      : `${projectId}_MainFile.json`;
    
    // Convert presentation to file content
    const fileContent = JSON.stringify(presentationData, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });

    // Note: You'll need to extend the existing Drive API to support file uploads
    // This is a conceptual example of how it would work
    const fileId = await this.uploadToGoogleDrive(file, projectId);
    return fileId;
  }

  async loadPresentation(projectId: string): Promise<PresentationData | null> {
    try {
      // Search for the main project file
      const searchResults = await google_drive_search({
        api_query: `name contains '${projectId}_MainFile' and parents in '${this.organizationFolderId}'`,
        semantic_query: null,
        page_size: 1
      });

      if (searchResults.length === 0) {
        return null;
      }

      // Fetch the file content
      const fileContent = await google_drive_fetch({
        document_ids: [searchResults[0].id]
      });

      return JSON.parse(fileContent) as PresentationData;
    } catch (error) {
      console.error('Failed to load presentation:', error);
      return null;
    }
  }

  async findUserProjects(userEmail: string): Promise<ProjectFile[]> {
    // Search for all presentation files the user has access to
    const searchResults = await google_drive_search({
      api_query: `name contains 'MainFile.json' and ('${userEmail}' in writers or '${userEmail}' in owners)`,
      semantic_query: 'interactive presentation project files',
      page_size: 50
    });

    return searchResults.map(result => ({
      projectId: this.extractProjectIdFromFileName(result.name),
      fileName: result.name,
      driveFileId: result.id,
      lastModified: result.lastModified,
      owner: result.owner
    }));
  }

  async uploadMediaFile(
    projectId: string, 
    file: File,
    fileName?: string
  ): Promise<string> {
    const finalFileName = fileName || `media_${Date.now()}_${file.name}`;
    
    // Create media folder if it doesn't exist
    const mediaFolderId = await this.ensureMediaFolder(projectId);
    
    // Upload file to media folder
    const fileId = await this.uploadToGoogleDrive(file, projectId, mediaFolderId);
    return fileId;
  }

  private async ensureMediaFolder(projectId: string): Promise<string> {
    // Search for existing media folder
    const searchResults = await google_drive_search({
      api_query: `name = 'Project_${projectId}_Media' and mimeType = 'application/vnd.google-apps.folder'`,
      semantic_query: null,
      page_size: 1
    });

    if (searchResults.length > 0) {
      return searchResults[0].id;
    }

    // Create media folder if it doesn't exist
    // Note: This would require extending the existing API
    return await this.createFolder(`Project_${projectId}_Media`, this.organizationFolderId);
  }
}
```

**Google Drive Organization Structure**:
```
📁 [Organization Name] - Interactive Presentations/
├── 📁 Active Projects/
│   ├── 📄 proj_1234_MainFile.json
│   ├── 📁 Project_proj_1234_Media/
│   │   ├── 🖼️ slide1_screenshot.png
│   │   ├── 🎥 demo_video.mp4
│   │   └── 🎵 narration_audio.wav
│   └── 📁 Project_proj_1234_Versions/
│       ├── 📄 proj_1234_v1705123456789.json
│       └── 📄 proj_1234_v1705234567890.json
├── 📁 Templates/
│   ├── 📄 Software_Demo_Template.json
│   ├── 📄 Training_Template.json
│   └── 📄 Product_Launch_Template.json
├── 📁 Archived Projects/
└── 📊 Collaboration_Master_Sheet.gsheet
```

**Success Criteria**:
- ✅ Files are organized logically in Google Drive
- ✅ Media files upload and link correctly to presentations
- ✅ Version history is maintained automatically
- ✅ File permissions sync with project permissions
- ✅ Large files are chunked and uploaded reliably

### Task 2.4: Google Slides Import Integration
**Files**: `utils/slidesImporter.ts`, `components/SlidesImportDialog.tsx`

**Implementation**:
- [ ] Add Google Slides API to required scopes
- [ ] Create slide-to-image export functionality  
- [ ] Implement bulk slide import workflow
- [ ] Add slide synchronization for updated Google Slides
- [ ] Create import progress tracking and error handling

**Required Additional Google API Scope**:
```typescript
const GOOGLE_SCOPES = [
  // ... existing scopes
  'https://www.googleapis.com/auth/presentations.readonly', // Read Google Slides
];
```

**Google Slides Import Implementation**:
```typescript
class GoogleSlidesImporter {
  private slidesAPI: any;
  private driveStorage: DriveStorageManager;

  async importFromGoogleSlides(
    slidesFileId: string,
    projectId: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      // Get presentation metadata
      const presentation = await this.slidesAPI.presentations.get({
        presentationId: slidesFileId
      });

      const slides = presentation.slides || [];
      const importedSlides: Slide[] = [];
      
      // Export each slide as an image
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideImage = await this.exportSlideAsImage(
          slidesFileId, 
          slide.objectId,
          options.imageQuality || 'high'
        );
        
        // Upload slide image to Drive and create slide object
        const mediaFileId = await this.driveStorage.uploadMediaFile(
          projectId,
          slideImage,
          `slide_${i + 1}_${slide.objectId}.png`
        );

        const importedSlide: Slide = {
          id: Date.now() + i,
          mediaUrl: await this.getDriveFileUrl(mediaFileId),
          mediaType: 'image',
          transform: { scale: 1, x: 0, y: 0 },
          spotlight: null,
          metadata: {
            originalSlideId: slide.objectId,
            slideNumber: i + 1,
            slidesFileId: slidesFileId,
            importedAt: new Date().toISOString()
          }
        };

        importedSlides.push(importedSlide);
      }

      return {
        success: true,
        slides: importedSlides,
        totalSlides: slides.length,
        presentationTitle: presentation.title,
        importMetadata: {
          sourceFileId: slidesFileId,
          importedAt: new Date().toISOString(),
          slideCount: slides.length
        }
      };

    } catch (error) {
      console.error('Failed to import Google Slides:', error);
      return {
        success: false,
        error: error.message,
        slides: []
      };
    }
  }

  private async exportSlideAsImage(
    presentationId: string,
    slideId: string,
    quality: 'low' | 'medium' | 'high' = 'high'
  ): Promise<File> {
    // Get slide thumbnail using Google Slides API
    const thumbnail = await this.slidesAPI.presentations.pages.getThumbnail({
      presentationId: presentationId,
      pageObjectId: slideId,
      'thumbnailProperties.thumbnailSize': this.getImageSize(quality)
    });

    // Convert thumbnail URL to File object
    const response = await fetch(thumbnail.contentUrl);
    const blob = await response.blob();
    return new File([blob], `slide_${slideId}.png`, { type: 'image/png' });
  }

  private getImageSize(quality: 'low' | 'medium' | 'high'): string {
    const sizes = {
      low: 'MEDIUM',      // ~800px wide
      medium: 'LARGE',    // ~1600px wide  
      high: 'EXTRA_LARGE' // ~3200px wide
    };
    return sizes[quality];
  }

  async checkForSlidesUpdates(
    slidesFileId: string,
    lastImportTimestamp: string
  ): Promise<boolean> {
    try {
      // Get the Google Slides file metadata from Drive
      const fileMetadata = await this.driveAPI.files.get({
        fileId: slidesFileId,
        fields: 'modifiedTime'
      });

      const lastModified = new Date(fileMetadata.modifiedTime);
      const lastImport = new Date(lastImportTimestamp);

      return lastModified > lastImport;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  async syncUpdatedSlides(
    projectId: string,
    slidesFileId: string,
    currentSlides: Slide[]
  ): Promise<SyncResult> {
    // Re-import slides and compare with existing slides
    const newImport = await this.importFromGoogleSlides(slidesFileId, projectId);
    
    if (!newImport.success) {
      return { success: false, error: newImport.error };
    }

    // Preserve existing click sequences and overlays when syncing
    const syncedSlides = newImport.slides.map((newSlide, index) => {
      const existingSlide = currentSlides[index];
      if (existingSlide) {
        // Keep existing interactive elements, update only the background media
        return {
          ...existingSlide,
          mediaUrl: newSlide.mediaUrl,
          metadata: {
            ...existingSlide.metadata,
            ...newSlide.metadata,
            lastSyncedAt: new Date().toISOString()
          }
        };
      }
      return newSlide;
    });

    return {
      success: true,
      slides: syncedSlides,
      changes: {
        slidesAdded: Math.max(0, newImport.slides.length - currentSlides.length),
        slidesUpdated: Math.min(newImport.slides.length, currentSlides.length),
        slidesRemoved: Math.max(0, currentSlides.length - newImport.slides.length)
      }
    };
  }
}
```

**Import Dialog Component**:
```typescript
interface SlidesImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (slides: Slide[], metadata: ImportMetadata) => void;
  projectId: string;
}

const SlidesImportDialog: React.FC<SlidesImportDialogProps> = ({
  isOpen, onClose, onImport, projectId
}) => {
  const [slidesFileId, setSlidesFileId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedSlides, setSelectedSlides] = useState<string>('all');
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('high');

  const handleImport = async () => {
    if (!slidesFileId.trim()) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const importer = new GoogleSlidesImporter();
      
      // Extract file ID from Google Slides URL if needed
      const fileId = extractFileIdFromUrl(slidesFileId) || slidesFileId;
      
      const result = await importer.importFromGoogleSlides(fileId, projectId, {
        imageQuality,
        progressCallback: (progress: number) => setImportProgress(progress)
      });

      if (result.success) {
        onImport(result.slides, result.importMetadata);
        onClose();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const extractFileIdFromUrl = (input: string): string | null => {
    // Handle Google Slides URLs like:
    // https://docs.google.com/presentation/d/FILE_ID/edit
    const match = input.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-content bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
        <h3 className="text-xl font-semibold mb-4">Import from Google Slides</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Google Slides URL or File ID
            </label>
            <input
              type="text"
              value={slidesFileId}
              onChange={(e) => setSlidesFileId(e.target.value)}
              placeholder="https://docs.google.com/presentation/d/..."
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              disabled={isImporting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Image Quality
            </label>
            <select
              value={imageQuality}
              onChange={(e) => setImageQuality(e.target.value as any)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              disabled={isImporting}
            >
              <option value="low">Low (Fast, smaller files)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Best quality, larger files)</option>
            </select>
          </div>

          {isImporting && (
            <div>
              <div className="bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Importing slides... {Math.round(importProgress)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleImport}
            disabled={isImporting || !slidesFileId.trim()}
            className="flex-1 p-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import Slides'}
          </button>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Types for Google Slides Integration**:
```typescript
interface ImportOptions {
  imageQuality?: 'low' | 'medium' | 'high';
  slideRange?: { start: number; end: number };
  progressCallback?: (progress: number) => void;
}

interface ImportResult {
  success: boolean;
  slides: Slide[];
  totalSlides?: number;
  presentationTitle?: string;
  importMetadata?: ImportMetadata;
  error?: string;
}

interface ImportMetadata {
  sourceFileId: string;
  importedAt: string;
  slideCount: number;
  lastSyncedAt?: string;
  originalTitle?: string;
}

interface SyncResult {
  success: boolean;
  slides?: Slide[];
  changes?: {
    slidesAdded: number;
    slidesUpdated: number;
    slidesRemoved: number;
  };
  error?: string;
}

// Extended Slide interface to include import metadata
interface Slide {
  // ... existing fields
  metadata?: {
    originalSlideId?: string;
    slideNumber?: number;
    slidesFileId?: string;
    importedAt?: string;
    lastSyncedAt?: string;
  };
}
```

**Success Criteria**:
- ✅ Import works with Google Slides URLs and file IDs
- ✅ All slides export as high-quality images
- ✅ Import progress is clearly visible to users
- ✅ Existing click sequences preserved during sync
- ✅ Large presentations (50+ slides) import reliably
- ✅ Image quality options balance file size vs clarity
- ✅ Sync detection works for updated Google Slides

**Workflow Integration**:
1. **Create in Google Slides** - Teams use familiar tools for content creation
2. **Import to Presentation Tool** - One-click import converts slides to interactive format
3. **Add Interactions** - Use your tool to add click sequences, spotlights, and text overlays
4. **Sync Updates** - When source slides change, sync preserves all interactive elements
5. **Export & Share** - Final presentation includes both slide content and interactions

---

## Phase 3: Team Collaboration Features

### Task 3.1: Project Management & Sharing
**Files**: `components/ProjectManager.tsx`, `components/SharingDialog.tsx`

**Implementation**:
- [ ] Create project browser and management interface
- [ ] Add team member invitation and role management
- [ ] Implement project templates and cloning
- [ ] Add project search and filtering
- [ ] Create project analytics and usage tracking

**Project Management UI**:
```typescript
interface ProjectManagerProps {
  userProjects: ProjectRecord[];
  onCreateProject: (template?: string) => void;
  onOpenProject: (projectId: string) => void;
  onShareProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
}

interface SharingSettings {
  projectId: string;
  collaborators: {
    email: string;
    role: 'viewer' | 'commenter' | 'editor';
    addedBy: string;
    addedAt: string;
  }[];
  organizationAccess: 'restricted' | 'anyone-in-org' | 'public';
  allowCopying: boolean;
  allowDownloading: boolean;
  expirationDate?: string;
}
```

**Success Criteria**:
- ✅ Project creation and management is intuitive
- ✅ Sharing settings are clearly understood and enforced
- ✅ Team member roles function as expected
- ✅ Project discovery helps teams find relevant presentations
- ✅ Analytics provide insights into team usage patterns

### Task 3.2: Version Control & Change Tracking
**Files**: `utils/versionControl.ts`, `components/VersionHistory.tsx`

**Implementation**:
- [ ] Automatic version creation on significant changes
- [ ] Visual diff viewer for comparing versions
- [ ] Branching support for experimental edits
- [ ] Merge capabilities for parallel work
- [ ] Change attribution and activity timeline

**Version Control with Google Drive/Sheets**:
```typescript
class GoogleVersionControl {
  async createAutoSave(
    projectId: string, 
    presentationData: PresentationData,
    changeDescription: string
  ): Promise<string> {
    // Save version to Drive
    const versionFileId = await this.driveStorage.savePresentation(
      projectId, 
      presentationData, 
      true // isNewVersion
    );

    // Record version in Sheets
    const versionRecord: VersionRecord = {
      versionId: generateUniqueId(),
      projectId,
      driveFileId: versionFileId,
      author: getCurrentUser().email,
      timestamp: new Date().toISOString(),
      description: changeDescription,
      changesSummary: this.generateChangesSummary(presentationData)
    };

    await this.collaborationDB.saveVersion(versionRecord);
    return versionRecord.versionId;
  }

  async compareVersions(
    versionId1: string, 
    versionId2: string
  ): Promise<VersionDiff> {
    const [version1, version2] = await Promise.all([
      this.loadVersion(versionId1),
      this.loadVersion(versionId2)
    ]);

    return {
      slidesAdded: this.findAddedSlides(version1, version2),
      slidesModified: this.findModifiedSlides(version1, version2),
      slidesDeleted: this.findDeletedSlides(version1, version2),
      clickSequenceChanges: this.compareClickSequences(version1, version2)
    };
  }
}
```

**Success Criteria**:
- ✅ Versions are created automatically without user intervention
- ✅ Version comparison clearly shows what changed
- ✅ Rollback functionality works reliably
- ✅ Version history doesn't impact performance
- ✅ Storage usage is managed efficiently

---

## Phase 4: Accessibility & Internationalization

### Task 4.1: WCAG Compliance & Screen Reader Support
**Files**: `components/AccessibilityProvider.tsx`, `utils/a11y.ts`

**Implementation**:
- [ ] Add comprehensive ARIA labels for all interactive elements
- [ ] Implement keyboard navigation for all functionality
- [ ] Add screen reader announcements for state changes
- [ ] Create focus management system for modals and overlays
- [ ] Add high contrast mode and color-blind friendly palettes
- [ ] Implement reduced motion preferences

**Accessibility Features**:
```typescript
interface AccessibilityOptions {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

// Screen reader announcements
const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

**Success Criteria**:
- ✅ WCAG 2.1 AA compliance verified with automated and manual testing
- ✅ All functionality accessible via keyboard only
- ✅ Screen reader users can create and replay presentations
- ✅ Color contrast ratios meet accessibility standards
- ✅ Focus indicators are clearly visible and logical

### Task 4.2: Internationalization (i18n) Support
**Files**: `locales/`, `hooks/useTranslation.ts`, `utils/i18n.ts`

**Implementation**:
- [ ] Set up React i18next for translation management
- [ ] Create translation files for major languages (EN, ES, FR, DE, JA)
- [ ] Implement RTL (right-to-left) language support
- [ ] Add locale-specific date/time formatting
- [ ] Create translation workflow for contributors
- [ ] Add language detection and switching

**Dependencies to Add**:
```json
{
  "dependencies": {
    "react-i18next": "^13.5.0",
    "i18next": "^23.7.0",
    "i18next-browser-languagedetector": "^7.2.0"
  }
}
```

**Translation Structure**:
```
locales/
├── en/
│   ├── common.json
│   ├── toolbar.json
│   ├── export.json
│   └── errors.json
├── es/
├── fr/
└── de/
```

**Success Criteria**:
- ✅ UI fully translatable with no hard-coded strings
- ✅ RTL languages render correctly
- ✅ Language switching works without page reload
- ✅ Date/time/number formatting respects locale
- ✅ Translation workflow is documented and efficient

### Task 4.3: Advanced Keyboard Shortcuts & Navigation
**Files**: `hooks/useAdvancedKeyboardShortcuts.ts`, `components/KeyboardShortcutsHelp.tsx`

**Implementation**:
- [ ] Expand keyboard shortcut system beyond basic navigation
- [ ] Add customizable keyboard shortcuts
- [ ] Create keyboard shortcuts help overlay
- [ ] Implement vim-style navigation modes (optional)
- [ ] Add accessibility shortcuts for assistive technologies

**Advanced Shortcuts**:
```typescript
interface KeyboardShortcuts {
  // Presentation control
  'space': 'play/pause replay',
  'f': 'toggle fullscreen',
  'esc': 'exit fullscreen/close modals',
  
  // Editing shortcuts
  'ctrl+z': 'undo last action',
  'ctrl+y': 'redo last action',
  'delete': 'delete selected element',
  
  // Quick actions
  'ctrl+e': 'export presentation',
  'ctrl+s': 'save presentation',
  'ctrl+o': 'open presentation',
  'ctrl+n': 'new presentation',
  
  // Accessibility
  'alt+h': 'show keyboard shortcuts help',
  'alt+c': 'toggle high contrast mode',
  'alt+r': 'toggle reduced motion',
}
```

**Success Criteria**:
- ✅ All major functionality accessible via keyboard
- ✅ Shortcuts are discoverable and customizable
- ✅ Help system clearly documents all shortcuts
- ✅ Shortcuts work consistently across all browsers
- ✅ No conflicts with browser or OS shortcuts

---

## Phase 5: Collaboration & Sharing

### Task 5.1: Real-time Collaboration System
**Files**: `utils/collaboration.ts`, `hooks/useCollaboration.ts`

**Implementation**:
- [ ] Implement WebSocket-based real-time synchronization
- [ ] Add user presence indicators (who's viewing/editing)
- [ ] Create conflict resolution for simultaneous edits
- [ ] Add collaborative cursor tracking
- [ ] Implement permission system (view/comment/edit)

**WebSocket Integration** (requires backend):
```typescript
interface CollaborationEvent {
  type: 'slide-update' | 'cursor-move' | 'user-join' | 'user-leave';
  userId: string;
  data: any;
  timestamp: number;
}

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number; slideIndex: number };
  permissions: 'view' | 'comment' | 'edit';
}
```

**Success Criteria**:
- ✅ Multiple users can view presentations simultaneously
- ✅ Real-time cursor tracking works smoothly
- ✅ Edit conflicts are resolved gracefully
- ✅ User presence is clearly visible
- ✅ Permissions system prevents unauthorized changes

### Task 5.2: Advanced Sharing & Privacy Controls
**Files**: `components/SharingModal.tsx`, `utils/sharing.ts`

**Implementation**:
- [ ] Create shareable links with expiration dates
- [ ] Add password protection for sensitive presentations
- [ ] Implement view-only vs edit permissions
- [ ] Add presentation embedding options
- [ ] Create usage analytics for shared presentations
- [ ] Add download restrictions and watermarking

**Sharing Options**:
```typescript
interface SharingSettings {
  linkType: 'public' | 'private' | 'password-protected';
  permissions: 'view' | 'comment' | 'edit';
  expirationDate?: Date;
  password?: string;
  allowDownload: boolean;
  showWatermark: boolean;
  trackViews: boolean;
  allowedDomains?: string[]; // Enterprise feature
}
```

**Success Criteria**:
- ✅ Sharing links work reliably across all platforms
- ✅ Password protection is secure and user-friendly
- ✅ Permission controls work as expected
- ✅ Analytics provide useful insights
- ✅ Privacy controls meet enterprise requirements

### Task 5.3: Version Control & History
**Files**: `utils/versionControl.ts`, `components/VersionHistory.tsx`

**Implementation**:
- [ ] Implement presentation version tracking
- [ ] Add visual diff between versions
- [ ] Create restore/rollback functionality
- [ ] Add automatic save and backup system
- [ ] Implement branching for experimental changes

**Version Control System**:
```typescript
interface PresentationVersion {
  id: string;
  parentId?: string;
  title: string;
  description?: string;
  author: string;
  timestamp: Date;
  changes: {
    type: 'slide-added' | 'slide-modified' | 'slide-deleted' | 'text-added';
    slideIndex?: number;
    details: string;
  }[];
  data: PresentationData;
}
```

**Success Criteria**:
- ✅ Version history is easily browsable
- ✅ Visual diffs clearly show changes
- ✅ Rollback functionality works reliably
- ✅ Auto-save prevents data loss
- ✅ Branching enables safe experimentation

---

## Phase 6: Advanced Presentation Features

### Task 6.1: Templates & Themes System
**Files**: `templates/`, `themes/`, `components/TemplateSelector.tsx`

**Implementation**:
- [ ] Create presentation template library
- [ ] Implement theme system with customizable colors/fonts
- [ ] Add slide layout templates (title, content, comparison, etc.)
- [ ] Create brand kit support for consistent styling
- [ ] Add template marketplace/sharing capability

**Template System**:
```typescript
interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'business' | 'education' | 'marketing' | 'technical';
  slides: SlideTemplate[];
  theme: Theme;
}

interface SlideTemplate {
  layout: 'title' | 'content' | 'two-column' | 'image-focus' | 'comparison';
  elements: TemplateElement[];
}

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    monospace: string;
  };
  spacing: Record<string, number>;
}
```

**Success Criteria**:
- ✅ Templates speed up presentation creation significantly
- ✅ Themes maintain visual consistency
- ✅ Custom branding can be applied easily
- ✅ Template library is searchable and organized
- ✅ Templates work across all device types

### Task 6.2: Advanced Canvas Tools
**Files**: `components/DrawingTools.tsx`, `utils/canvasDrawing.ts`

**Implementation**:
- [ ] Add drawing/annotation tools (pen, highlighter, shapes)
- [ ] Implement arrow and callout creation
- [ ] Add shape library (rectangles, circles, arrows)
- [ ] Create freehand drawing with pressure sensitivity
- [ ] Add eraser and selection tools

**Drawing Tools Interface**:
```typescript
interface DrawingTool {
  type: 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'circle' | 'text' | 'eraser';
  color: string;
  strokeWidth: number;
  opacity: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface DrawnElement {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number; pressure?: number }[];
  bounds: { x: number; y: number; width: number; height: number };
  slideIndex: number;
}
```

**Success Criteria**:
- ✅ Drawing tools work smoothly on both mouse and touch
- ✅ Annotations can be edited and deleted
- ✅ Drawing performance maintains 60fps
- ✅ Tools work with zoom/pan transformations
- ✅ Drawings export correctly in all formats

### Task 6.3: Audio Narration & Timing
**Files**: `utils/audioRecording.ts`, `components/AudioControls.tsx`

**Implementation**:
- [ ] Add audio recording for each slide
- [ ] Implement audio playback synchronized with replay
- [ ] Create audio editing tools (trim, volume, fade)
- [ ] Add automatic subtitle generation
- [ ] Support for background music and sound effects

**Audio System**:
```typescript
interface AudioTrack {
  id: string;
  slideIndex: number;
  audioBlob: Blob;
  duration: number;
  volume: number;
  startTime: number; // When to start relative to slide
  transcript?: string;
  waveform?: number[]; // For visual representation
}

interface AudioControls {
  isRecording: boolean;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playbackRate: number;
}
```

**Success Criteria**:
- ✅ Audio recording works across all browsers
- ✅ Audio sync is accurate during replay
- ✅ Audio editing tools are intuitive
- ✅ Subtitles improve accessibility
- ✅ Audio exports with video recordings

### Task 6.4: Analytics & Engagement Tracking
**Files**: `utils/analytics.ts`, `components/AnalyticsDashboard.tsx`

**Implementation**:
- [ ] Track presentation view metrics
- [ ] Monitor user engagement and interaction patterns
- [ ] Add heatmaps showing where viewers focus
- [ ] Create completion rates and drop-off analysis
- [ ] Implement A/B testing for presentation effectiveness

**Analytics Data Model**:
```typescript
interface PresentationAnalytics {
  presentationId: string;
  totalViews: number;
  uniqueViewers: number;
  averageViewTime: number;
  completionRate: number;
  slideMetrics: {
    slideIndex: number;
    viewTime: number;
    skipRate: number;
    interactionCount: number;
  }[];
  engagementHeatmap: {
    x: number;
    y: number;
    intensity: number;
  }[];
}
```

**Success Criteria**:
- ✅ Analytics provide actionable insights
- ✅ Heatmaps accurately show viewer attention
- ✅ Data collection respects privacy regulations
- ✅ Dashboard is intuitive and informative
- ✅ A/B testing enables presentation optimization

### Task 6.5: Offline Support & Progressive Web App
**Files**: `sw.js`, `utils/offline.ts`, `components/OfflineIndicator.tsx`

**Implementation**:
- [ ] Implement service worker for offline functionality
- [ ] Add presentation caching for offline viewing
- [ ] Create offline editing with sync when online
- [ ] Add PWA manifest for app-like experience
- [ ] Implement background sync for uploads

**PWA Configuration**:
```json
{
  "name": "Interactive Presentation Tool",
  "short_name": "PresentTool",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#06b6d4",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Success Criteria**:
- ✅ App works reliably without internet connection
- ✅ Offline edits sync properly when online
- ✅ PWA can be installed on devices
- ✅ Service worker updates don't break functionality
- ✅ Cache management prevents storage bloat

---

## Phase 0: Development Infrastructure Setup

### Task 0.1: Testing Infrastructure
**Files**: `package.json`, `jest.config.js`, `__tests__/` directory

**Implementation**:
- [ ] Install testing dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `jest`, `jest-environment-jsdom`
- [ ] Configure Jest with TypeScript support
- [ ] Set up React Testing Library configuration
- [ ] Create test utilities and custom render functions
- [ ] Add coverage reporting and thresholds
- [ ] Set up E2E testing with Playwright

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "ts-jest": "^29.1.0"
  }
}
```

**Success Criteria**:
- ✅ Unit tests run with `npm test`
- ✅ Coverage reports generated with 80%+ target
- ✅ E2E tests can run full workflow scenarios
- ✅ Tests run in CI/CD pipeline
- ✅ Test utilities properly handle canvas and media elements

### Task 0.2: Code Quality & Linting
**Files**: `.eslintrc.js`, `.prettierrc`, `package.json`

**Implementation**:
- [ ] Install ESLint with TypeScript and React plugins
- [ ] Configure Prettier for consistent formatting
- [ ] Set up import sorting and organization rules
- [ ] Add accessibility linting (eslint-plugin-jsx-a11y)
- [ ] Configure performance and best practices rules
- [ ] Add custom rules for project-specific patterns

**Alternative: Biome (Faster, All-in-One Tool)**:
```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.4.0"
  }
}
```

**Standard ESLint Setup**:
```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.12.0",
    "@typescript-eslint/parser": "^6.12.0",
    "eslint": "^8.54.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-import": "^2.29.0",
    "prettier": "^3.1.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0"
  }
}
```

**ESLint Configuration**:
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  rules: {
    // Performance rules
    'react-hooks/exhaustive-deps': 'error',
    'react/prop-types': 'off', // Using TypeScript
    
    // Accessibility rules
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    
    // Import organization
    'import/order': ['error', { 'newlines-between': 'always' }],
    
    // Custom rules for canvas/media handling
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'error'
  }
};
```

**Biome Configuration (Alternative)**:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.4.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "useHookAtTopLevel": "error" },
      "a11y": { "recommended": true },
      "performance": { "noDelete": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

**Success Criteria**:
- ✅ Code passes all linting rules without warnings
- ✅ Formatting is consistent and automatic
- ✅ Import statements are organized and sorted
- ✅ Accessibility issues are caught at build time
- ✅ Performance anti-patterns are flagged
- ✅ Linting is fast (< 3 seconds for full codebase)

### Task 0.3: Git Hooks & Pre-commit Checks
**Files**: `.husky/`, `lint-staged.config.js`, `package.json`

**Implementation**:
- [ ] Install Husky for git hooks management
- [ ] Set up lint-staged for pre-commit file processing
- [ ] Configure pre-commit hooks: lint, format, test
- [ ] Add commit message linting (conventional commits)
- [ ] Set up pre-push hooks for full test suite

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.1.0",
    "@commitlint/cli": "^18.4.0",
    "@commitlint/config-conventional": "^18.4.0"
  }
}
```

**Configuration**:
```javascript
// lint-staged.config.js
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --findRelatedTests --passWithNoTests'
  ],
  '*.{css,md,json}': ['prettier --write']
};
```

**Success Criteria**:
- ✅ Pre-commit hooks prevent bad code from being committed
- ✅ Commit messages follow conventional format
- ✅ Only staged files are processed (fast pre-commit)
- ✅ Pre-push hooks run full test suite
- ✅ Hooks work across different development environments

### Task 0.4: TypeScript Configuration Enhancement
**Files**: `tsconfig.json`, `types/global.d.ts`

**Implementation**:
- [ ] Enable strict TypeScript configuration
- [ ] Add path mapping for cleaner imports
- [ ] Set up global type definitions for media APIs
- [ ] Configure module resolution for better development experience
- [ ] Add type-only imports where appropriate

**Enhanced TypeScript Config**:
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"]
    },
    
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

**Success Criteria**:
- ✅ Zero TypeScript errors in strict mode
- ✅ Path imports work correctly (@/components/...)
- ✅ Media API types are properly defined
- ✅ Type inference is maximized, explicit types minimized
- ✅ Build performance is optimized

### Task 0.5: CI/CD Pipeline Setup
**Files**: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

**Implementation**:
- [ ] Set up GitHub Actions for continuous integration
- [ ] Configure automated testing on pull requests
- [ ] Add build verification and type checking
- [ ] Set up automated deployment pipeline
- [ ] Configure environment-specific builds
- [ ] Add security scanning and dependency checks

**CI Workflow Example**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

**Success Criteria**:
- ✅ All PRs automatically tested before merge
- ✅ Build failures prevent deployment
- ✅ Coverage reports are generated and tracked
- ✅ Security vulnerabilities are detected
- ✅ Deployment is automated for main branch

### Task 0.6: Performance Monitoring & Bundle Analysis
**Files**: `vite.config.ts`, `package.json`

**Implementation**:
- [ ] Configure bundle analysis with rollup-plugin-visualizer
- [ ] Add performance monitoring setup
- [ ] Set up build optimization analysis
- [ ] Configure code splitting strategies
- [ ] Add runtime performance monitoring

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.9.0",
    "vite-bundle-analyzer": "^0.7.0",
    "@sentry/react": "^7.80.0",
    "web-vitals": "^3.5.0"
  }
}
```

**Vite Configuration Enhancement**:
```typescript
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./utils/exportUtils', './utils/recordingUtils']
        }
      }
    }
  },
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true
    })
  ]
});
```

**Success Criteria**:
- ✅ Bundle size is optimized and tracked
- ✅ Code splitting reduces initial load time
- ✅ Performance metrics are monitored in production
- ✅ Bundle analysis reports are generated on build
- ✅ Runtime errors are captured and tracked

### Task 0.7: Documentation & Developer Experience
**Files**: `README.md`, `CONTRIBUTING.md`, `docs/`, `package.json`

**Implementation**:
- [ ] Create comprehensive README with setup instructions
- [ ] Add API documentation for all utility functions
- [ ] Set up component documentation with examples
- [ ] Create troubleshooting guide for common issues
- [ ] Add development workflow documentation
- [ ] Set up automated changelog generation

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "@storybook/react": "^7.6.0",
    "@storybook/react-vite": "^7.6.0",
    "typedoc": "^0.25.0",
    "conventional-changelog-cli": "^4.1.0"
  }
}
```

**Documentation Structure**:
```
docs/
├── getting-started.md
├── api/
│   ├── components.md
│   ├── hooks.md
│   └── utils.md
├── guides/
│   ├── mobile-development.md
│   ├── testing.md
│   └── deployment.md
└── troubleshooting.md
```

**Success Criteria**:
- ✅ New developers can get app running in < 10 minutes
- ✅ All public APIs are documented with examples
- ✅ Component library is browsable (Storybook)
- ✅ Common issues have documented solutions
- ✅ Contributing guidelines are clear and followed

---

## Phase 1: Mobile/Touch Optimization

### Task 1.1: Create Touch Gesture Hook
**File**: `hooks/useTouchGestures.ts`

**Implementation**:
- [ ] Create `useTouchGestures` hook with pinch-to-zoom, pan, tap, and long-press detection
- [ ] Add distance calculation for pinch gestures
- [ ] Implement gesture state management (tracking touches, timers)
- [ ] Add gesture conflict resolution (prevent scroll during gestures)

**Success Criteria**:
- ✅ Hook correctly detects single tap vs long press (< 300ms vs > 500ms)
- ✅ Pinch gesture accurately calculates scale and center point
- ✅ Pan gesture provides smooth delta values
- ✅ No interference with existing mouse events

**Testing**:
```javascript
// Test cases for gesture hook
describe('Touch Gestures', () => {
  test('Single tap triggers onTap callback')
  test('Long press (>500ms) triggers onLongPress callback') 
  test('Pinch gesture calculates correct scale ratio')
  test('Pan gesture provides accurate delta values')
  test('Gesture conflicts are properly resolved')
})
```

### Task 1.2: Integrate Touch Gestures in Canvas
**File**: `components/Canvas.tsx`

**Implementation**:
- [ ] Import and use `useTouchGestures` hook
- [ ] Map touch events to existing canvas interactions
- [ ] Add touch event handlers to canvas div
- [ ] Ensure touch and mouse events don't conflict
- [ ] Add CSS touch-action properties for performance

**Success Criteria**:
- ✅ Touch zoom centers on pinch point, not canvas center
- ✅ Touch pan works smoothly without page scroll
- ✅ Touch tap creates spotlight or triggers zoom (based on active tool)
- ✅ Long press could trigger context menu or tool switch

**Testing**:
- Manual testing on touch devices (tablet/phone)
- Verify no double-triggering with mouse events
- Test all tool modes work with touch

### Task 1.3: Responsive Toolbar Design
**File**: `components/Toolbar.tsx`

**Implementation**:
- [ ] Add responsive breakpoints for mobile screens
- [ ] Stack toolbar vertically on narrow screens
- [ ] Increase button sizes for touch targets (min 44px)
- [ ] Add swipe indicators for mobile slide navigation
- [ ] Optimize toolbar positioning for different screen sizes

**Success Criteria**:
- ✅ Toolbar usable on screens as small as 375px width
- ✅ All buttons meet WCAG touch target guidelines (44px minimum)
- ✅ Toolbar doesn't overlap with slide content on mobile
- ✅ Slide counter remains visible and readable

**CSS Testing**:
```css
/* Test responsive breakpoints */
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 480px) { /* Mobile */ }
@media (orientation: landscape) and (max-height: 500px) { /* Mobile landscape */ }
```

### Task 1.4: Media Upload & Capture Interface
**Files**: `components/MediaUploader.tsx` (new), `components/Canvas.tsx`

**Implementation**:
- [ ] Create click-to-upload overlay for empty slides
- [ ] Add file browser integration (accept image/video files)
- [ ] Implement camera/photo library access on mobile devices
- [ ] Add media preview before confirming upload
- [ ] Create media source selection modal (camera, library, file browser)
- [ ] Add media type validation and compression options

**Camera/Media Access**:
```typescript
// Media capture capabilities
interface MediaCaptureOptions {
  source: 'camera' | 'library' | 'file-browser';
  mediaType: 'photo' | 'video' | 'both';
  quality: 'low' | 'medium' | 'high';
  facingMode?: 'user' | 'environment'; // Front/back camera
}

// Media upload component
interface MediaUploaderProps {
  onMediaSelected: (file: File) => void;
  onCancel: () => void;
  acceptedTypes: string[];
  maxFileSize: number;
}
```

**Success Criteria**:
- ✅ Click/tap on empty slide opens media selection options
- ✅ Camera access works on iOS Safari and Android Chrome
- ✅ Photo library access works on mobile devices
- ✅ File browser works on all desktop platforms
- ✅ Media preview shows before final upload
- ✅ Large files are compressed automatically
- ✅ Clear error messages for unsupported formats/sizes

**Mobile-Specific Features**:
- Native camera app integration
- Photo library picker integration
- Video recording with duration limits
- Automatic orientation detection
- Compression for large media files

### Task 1.5: Mobile Navigation Enhancements  
**File**: `App.tsx`

**Implementation**:
- [ ] Add swipe gestures for slide navigation
- [ ] Implement touch-friendly slide transition animations
- [ ] Add haptic feedback for touch interactions (if supported)
- [ ] Optimize slide transition performance for mobile

**Success Criteria**:
- ✅ Swipe left/right changes slides with smooth animation
- ✅ Swipe threshold prevents accidental navigation
- ✅ Slide transitions maintain 60fps on mobile devices
- ✅ Navigation works in both portrait and landscape modes

---

## Phase 2: Export Functionality

### Task 2.1: JSON Export/Import System
**File**: `utils/exportUtils.ts`

**Implementation**:
- [ ] Create presentation data schema with versioning
- [ ] Implement JSON serialization for slides and click sequences
- [ ] Handle media URL conversion (blob to base64 for portability)
- [ ] Add metadata tracking (title, creation date, version)
- [ ] Create import validation and error handling

**Success Criteria**:
- ✅ Exported JSON contains all presentation data
- ✅ Import recreates exact presentation state
- ✅ Media files are properly embedded or referenced
- ✅ Graceful handling of invalid/corrupted import files

**Testing**:
```javascript
// Export/Import validation tests
test('Export contains all slides and click sequences')
test('Import recreates identical presentation')
test('Invalid JSON files show appropriate error messages')
test('Version compatibility is maintained')
```

### Task 2.2: PDF Export Capability
**Dependencies**: Add `html2canvas` and `jspdf` to package.json

**Implementation**:
- [ ] Install required dependencies: `npm install html2canvas jspdf`
- [ ] Create slide-to-canvas rendering system
- [ ] Implement PDF generation with proper page layouts
- [ ] Add progress indicators for long export operations
- [ ] Handle different slide aspect ratios

**Success Criteria**:
- ✅ Each slide renders as a separate PDF page
- ✅ Images maintain aspect ratio and quality
- ✅ PDF includes slide numbers and optional metadata
- ✅ Export progress is visible to user

### Task 2.3: Video Recording Integration
**File**: `utils/recordingUtils.ts`

**Implementation**:
- [ ] Implement MediaRecorder API integration
- [ ] Add screen capture permissions and error handling
- [ ] Create recording controls (start/stop/pause)
- [ ] Add recording indicator in UI
- [ ] Handle audio recording (optional)

**Success Criteria**:
- ✅ Can record full presentation replay as video
- ✅ Video quality is configurable (720p/1080p)
- ✅ Recording includes cursor movements and interactions
- ✅ Generated video file downloads automatically

### Task 2.4: Export UI Integration
**File**: `components/ExportMenu.tsx` (new component)

**Implementation**:
- [ ] Create export dropdown/modal component
- [ ] Add export format selection (JSON/PDF/Video)
- [ ] Implement export progress indicators
- [ ] Add export settings (quality, format options)
- [ ] Integrate with main toolbar

**Success Criteria**:
- ✅ Export menu is accessible and intuitive
- ✅ All export formats work reliably
- ✅ Export progress provides user feedback
- ✅ Export failures show helpful error messages

---

## Phase 3: Text Overlay System

### Task 3.1: Text Overlay Data Model
**File**: `types.ts`

**Implementation**:
- [ ] Extend `ClickRecord` interface to include text data
- [ ] Add intelligent positioning system to avoid covering click targets
- [ ] Create callout/annotation styling with connecting elements
- [ ] Add text animation types (fade-in, slide-in, etc.)
- [ ] Add text visibility duration settings

**Updated Types**:
```typescript
interface TextOverlay {
  id: string;
  text: string;
  clickPoint: { x: number; y: number }; // Where user clicked
  textPosition: { x: number; y: number }; // Where text appears (calculated)
  positioning: {
    strategy: 'smart' | 'callout' | 'side-panel' | 'follow-cursor';
    offset: { x: number; y: number }; // Offset from click point
    anchor: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  };
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    fontWeight: 'normal' | 'bold';
    maxWidth: number;
    borderRadius: number;
    padding: number;
  };
  connector: {
    show: boolean;
    type: 'arrow' | 'line' | 'none';
    color: string;
    width: number;
  };
  animation: {
    type: 'fade' | 'slide' | 'scale' | 'pop';
    duration: number;
    delay: number;
  };
  displayDuration: number; // How long to show text (ms)
}

interface ClickRecord {
  // ... existing fields
  textOverlay?: TextOverlay;
}
```

### Task 3.2: Text Entry Component
**File**: `components/TextEditor.tsx` (new component)

**Implementation**:
- [ ] Create modal text editor with rich formatting
- [ ] Add text styling controls (size, color, weight)
- [ ] Implement positioning strategy selector (smart, callout, side-panel, follow-cursor)
- [ ] Add real-time preview showing text position relative to click point
- [ ] Create visual preview with connecting lines/arrows
- [ ] Add text templates/presets for common use cases

**Success Criteria**:
- ✅ Text editor opens immediately after click capture
- ✅ Live preview shows exactly where text will appear (not covering click target)
- ✅ Positioning options are intuitive with visual examples
- ✅ Can adjust text position manually if auto-positioning isn't ideal
- ✅ Preview updates in real-time as user types and changes settings

**Updated Canvas Component (Empty State)**:
```typescript
// Enhanced empty slide UI with upload options
const EmptySlideContent = ({ onMediaSelected }: { onMediaSelected: (file: File) => void }) => {
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-semibold border-4 border-dashed border-gray-600 rounded-2xl">
      {!showMediaOptions ? (
        <div className="text-center space-y-4">
          <p>Add media to this slide</p>
          <button 
            onClick={() => setShowMediaOptions(true)}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Choose Media Source
          </button>
          <p className="text-sm text-gray-400">Or paste an image or drop a file</p>
        </div>
      ) : (
        <MediaUploader 
          onMediaSelected={onMediaSelected}
          onCancel={() => setShowMediaOptions(false)}
          acceptedTypes={['image/*', 'video/*']}
          maxFileSize={50 * 1024 * 1024} // 50MB
        />
      )}
    </div>
  );
};
```

**Media Source Selection Interface**:
```typescript
const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaSelected, onCancel, acceptedTypes, maxFileSize }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Back camera preferred
        audio: false 
      });
      
      // Create video element for camera preview
      // Implement camera capture UI
      // Convert captured frame to File object
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fall back to file picker
      fileInputRef.current?.click();
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= maxFileSize) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Select Media Source</h3>
      
      <div className="space-y-3">
        <button onClick={handleCameraCapture} className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700">
          📷 Take Photo/Video
        </button>
        
        <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700">
          📁 Choose from Device
        </button>
        
        <button onClick={onCancel} className="w-full p-3 bg-gray-600 text-white rounded hover:bg-gray-700">
          Cancel
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        capture="environment" // Prefer back camera on mobile
      />
      
      {preview && selectedFile && (
        <div className="mt-4">
          <div className="mb-2">
            {selectedFile.type.startsWith('image/') ? (
              <img src={preview} alt="Preview" className="max-w-full max-h-32 object-contain mx-auto" />
            ) : (
              <video src={preview} className="max-w-full max-h-32 object-contain mx-auto" controls />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onMediaSelected(selectedFile)} className="flex-1 p-2 bg-green-600 text-white rounded">
              Use This Media
            </button>
            <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="flex-1 p-2 bg-gray-600 text-white rounded">
              Choose Different
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

**UI Features**:
- Live preview overlay showing text position
- Drag handles to manually adjust text placement
- Preset positioning options: "Smart Auto", "Speech Bubble", "Side Note", "Follow Cursor"
- Visual indicators showing the connection between click point and text

### Task 3.3: Text Overlay Rendering
**File**: `components/TextOverlay.tsx` (new component)

**Implementation**:
- [ ] Create intelligent positioning algorithm to avoid covering click targets
- [ ] Implement callout-style text boxes with connecting arrows/lines
- [ ] Add collision detection to prevent text overlapping screen edges
- [ ] Create positioning strategies:
  - **Smart**: Auto-position based on available space around click point
  - **Callout**: Speech bubble style with pointer to click location
  - **Side-panel**: Text in dedicated area (top/bottom) with visual connection
  - **Follow-cursor**: Text trails slightly behind the replay cursor
- [ ] Add z-index management for overlay layering

**Positioning Logic**:
```typescript
// Smart positioning algorithm
function calculateTextPosition(
  clickPoint: { x: number; y: number },
  textDimensions: { width: number; height: number },
  canvasDimensions: { width: number; height: number },
  offset: number = 60 // minimum distance from click point
): { x: number; y: number; anchor: string } {
  // Try positions in order of preference: top-right, top-left, bottom-right, bottom-left
  const positions = [
    { x: clickPoint.x + offset, y: clickPoint.y - textDimensions.height - offset, anchor: 'top-right' },
    { x: clickPoint.x - textDimensions.width - offset, y: clickPoint.y - textDimensions.height - offset, anchor: 'top-left' },
    { x: clickPoint.x + offset, y: clickPoint.y + offset, anchor: 'bottom-right' },
    { x: clickPoint.x - textDimensions.width - offset, y: clickPoint.y + offset, anchor: 'bottom-left' }
  ];
  
  // Return first position that fits within canvas bounds
  for (const pos of positions) {
    if (pos.x >= 0 && pos.y >= 0 && 
        pos.x + textDimensions.width <= canvasDimensions.width && 
        pos.y + textDimensions.height <= canvasDimensions.height) {
      return pos;
    }
  }
  
  // Fallback: position at screen edge with best fit
  return positions[0]; // Could be enhanced with edge-clamping logic
}
```

**Success Criteria**:
- ✅ Text never covers the click target area
- ✅ Text positioning adapts to screen edges and available space
- ✅ Connecting arrows/lines clearly link text to click points
- ✅ Multiple text overlays don't overlap each other
- ✅ Text remains readable against various background colors

### Task 3.4: Text Overlay Integration
**Files**: `components/Canvas.tsx`, `App.tsx`

**Implementation**:
- [ ] Integrate text editor into click capture workflow
- [ ] Add text overlay rendering to canvas
- [ ] Implement text overlay replay timing
- [ ] Add text overlay editing capabilities
- [ ] Create text overlay management in slide state

**Success Criteria**:
- ✅ Text entry is seamless part of capture workflow
- ✅ Text overlays replay with correct timing
- ✅ Can edit or remove text overlays after creation
- ✅ Text overlays export/import correctly

---

## Testing & Quality Assurance

### Comprehensive Testing Plan

#### Unit Tests
- [ ] All new utility functions have 95%+ test coverage
- [ ] Component props and state changes are tested
- [ ] Export/import functionality tested with various data sets
- [ ] Touch gesture calculations tested with edge cases
- [ ] Media upload/capture flows tested with mocks
- [ ] Text positioning algorithms tested with boundary conditions
- [ ] Accessibility utilities tested for WCAG compliance
- [ ] Internationalization functions tested with multiple locales
- [ ] Collaboration features tested with simulated users
- [ ] Audio recording/playback tested with mock media streams
- [ ] Drawing tools tested with various input methods
- [ ] Analytics tracking tested with mock data

#### Integration Tests  
- [ ] Full workflow tests (capture → text → replay → export)
- [ ] Media upload from all sources (camera, library, file browser)
- [ ] Cross-platform compatibility (Windows, Mac, iOS, Android)
- [ ] Browser compatibility (Chrome, Safari, Firefox, Edge)
- [ ] Performance testing with large presentations (50+ slides)
- [ ] Camera permissions and privacy compliance
- [ ] Real-time collaboration with multiple users
- [ ] Accessibility compliance across all features
- [ ] Internationalization with RTL languages
- [ ] Offline functionality and sync testing
- [ ] Audio/video export quality verification

#### End-to-End Tests
- [ ] Complete user journeys tested with Playwright
- [ ] Mobile device testing (real devices + emulation)
- [ ] File upload/download workflows
- [ ] Cross-browser presentation replay
- [ ] Export functionality across different formats
- [ ] Error handling and recovery scenarios
- [ ] Collaborative editing workflows
- [ ] Accessibility navigation with screen readers
- [ ] Multi-language user experience
- [ ] PWA installation and offline usage
- [ ] Audio narration and synchronization

#### Code Quality Tests
- [ ] ESLint passes with zero warnings
- [ ] TypeScript compilation in strict mode
- [ ] Prettier formatting consistency
- [ ] Import organization and dependency analysis
- [ ] Bundle size within acceptable limits (< 3MB gzipped)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance regression testing
- [ ] Security vulnerability scanning

#### Manual Testing Checklist

**Mobile Functionality**:
- [ ] Touch zoom works smoothly on iOS Safari
- [ ] Touch zoom works smoothly on Android Chrome  
- [ ] Swipe navigation works in both orientations
- [ ] All buttons are reachable and tappable
- [ ] No accidental zooms during normal interaction
- [ ] Camera access works on mobile devices
- [ ] Photo library picker works on mobile devices
- [ ] File upload works on all platforms
- [ ] Media compression maintains acceptable quality

**Export Functionality**:
- [ ] JSON export → import recreates identical presentation
- [ ] PDF export maintains image quality and layout
- [ ] Video recording captures all interactions clearly
- [ ] Large presentations (100+ clicks) export successfully
- [ ] Export works with presentations containing videos
- [ ] Audio narration exports synchronized with video

**Text Overlay System**:
- [ ] Text editor opens quickly after each click
- [ ] Text positioning automatically avoids covering click targets
- [ ] Smart positioning works correctly near screen edges
- [ ] Connecting arrows/lines point accurately to click locations
- [ ] Text animations play smoothly during replay
- [ ] Text overlays work with spotlight effects
- [ ] Text is readable on light and dark backgrounds
- [ ] Multiple text overlays don't overlap or interfere
- [ ] Manual text positioning (drag to adjust) works smoothly

**Accessibility Features**:
- [ ] All functionality accessible via keyboard navigation
- [ ] Screen reader announces all important state changes
- [ ] High contrast mode maintains usability
- [ ] Focus indicators are clearly visible
- [ ] Tab order is logical and intuitive
- [ ] ARIA labels are descriptive and accurate
- [ ] Color-blind users can distinguish all interface elements

**Internationalization**:
- [ ] UI translates completely in all supported languages
- [ ] RTL languages (Arabic, Hebrew) render correctly
- [ ] Date/time formatting respects locale settings
- [ ] Text direction changes don't break layout
- [ ] Character encoding handles all Unicode properly

**Collaboration Features**:
- [ ] Real-time cursor tracking is smooth and accurate
- [ ] User presence indicators update promptly
- [ ] Edit conflicts resolve without data loss
- [ ] Sharing links work across all platforms
- [ ] Permission controls enforce access restrictions
- [ ] Version history shows clear diffs

**Advanced Features**:
- [ ] Templates apply correctly and maintain consistency
- [ ] Drawing tools work smoothly on touch and mouse
- [ ] Audio recording/playback synchronizes perfectly
- [ ] Analytics capture accurate engagement data
- [ ] Offline mode works reliably without internet
- [ ] PWA installation process is smooth

#### Performance Benchmarks
- [ ] App startup time < 2 seconds
- [ ] Slide transitions < 200ms on mobile
- [ ] Touch gesture response time < 16ms (60fps)
- [ ] Export time scales linearly with content size
- [ ] Memory usage stable during long sessions
- [ ] Bundle size < 2MB gzipped
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s

#### Code Quality Benchmarks
- [ ] Test coverage > 95% for critical paths
- [ ] TypeScript strict mode with zero errors
- [ ] ESLint score: zero warnings, zero errors
- [ ] Accessibility score > 95% (Lighthouse)
- [ ] Performance score > 90% (Lighthouse)
- [ ] SEO score > 90% (Lighthouse)

#### Regression Testing
- [ ] All existing keyboard shortcuts still work
- [ ] Mouse interactions unchanged for desktop users
- [ ] Existing presentations load and play correctly
- [ ] No memory leaks during extended use
- [ ] Canvas rendering performance maintained

### Success Metrics - Collaboration Priority

**Development Infrastructure**:
- ✅ 95%+ test coverage for all critical functionality
- ✅ Zero ESLint warnings/errors across entire codebase
- ✅ TypeScript strict mode with zero compilation errors
- ✅ All commits pass pre-commit hooks
- ✅ CI/CD pipeline success rate > 98%

**Google Workspace Integration**:
- ✅ Google OAuth authentication success rate > 99%
- ✅ Google Sheets database operations complete < 2 seconds
- ✅ Google Drive file uploads succeed > 98% of time
- ✅ Organization domain restrictions enforce properly
- ✅ File permissions sync correctly with Google Drive
- ✅ Large file uploads (50MB+) complete reliably
- ✅ Google API rate limits are respected and handled gracefully

**Team Collaboration**:
- ✅ Real-time sync latency < 3 seconds (polling-based)
- ✅ Concurrent user support up to 10 users per presentation
- ✅ Version creation and retrieval < 5 seconds
- ✅ User presence updates within 5 seconds
- ✅ Edit conflict resolution success rate > 95%
- ✅ Activity logging captures 100% of user actions
- ✅ Project sharing works across organization domains

**Core Functionality (MVP)**:
- ✅ 100% of touch interactions work as expected
- ✅ App is fully usable on screens ≥ 375px width
- ✅ Touch response time averages < 50ms
- ✅ Camera access works on 95%+ of mobile devices
- ✅ Media upload success rate > 98% across all platforms
- ✅ All export formats complete successfully 95%+ of time
- ✅ Text positioning avoids click targets 100% of time

**Enterprise Requirements**:
- ✅ GDPR compliance for data stored in Google Workspace
- ✅ Organization security policies enforced
- ✅ Audit trail completeness for all collaborative actions
- ✅ Data residency requirements met through Google's infrastructure
- ✅ Single sign-on integration with organization's identity provider

**Export Functionality**:
- ✅ All export formats complete successfully 95%+ of time
- ✅ Export file sizes are reasonable (< 50MB for typical presentations)
- ✅ Import success rate > 99% for valid files
- ✅ Export operations provide clear progress feedback

**Text Overlays**:
- ✅ Text entry workflow adds < 10 seconds per click
- ✅ Text overlays are pixel-perfect positioned
- ✅ Text rendering performance doesn't impact smooth replay
- ✅ Text editing is intuitive for non-technical users

---

## Implementation Timeline - Collaboration Priority

**Phase 0 (Week 1)**: Development infrastructure setup (testing, linting, CI/CD, type safety)
**Phase 1 (Week 2)**: Mobile touch gestures and responsive design
**Phase 2 (Week 3-4)**: Google Drive/Sheets backend integration and authentication
**Phase 3 (Week 5-6)**: Team collaboration features (sharing, version control, real-time sync)
**Phase 4 (Week 7)**: Export functionality (JSON, PDF, video) and text overlays
**Phase 5 (Week 8)**: Media upload/capture integration
**Phase 6 (Week 9-10)**: Advanced collaboration features and optimization

**Total Timeline: 10 weeks for collaboration-focused implementation**

### Collaboration-First Release Strategy:
**Week 1-2**: Core functionality + mobile support
**Week 3-4**: Google Workspace integration (save, share, authenticate)
**Week 5-6**: Team collaboration (real-time editing, version control)
**Week 7-8**: Export and media features
**Week 9-10**: Polish and advanced collaboration features

### Google Workspace Integration Benefits:
- **No custom backend required** - leverages existing enterprise infrastructure
- **Enterprise security** - inherits organization's Google Workspace policies
- **Familiar permissions** - uses same sharing model as Google Docs
- **Automatic backups** - Google Drive handles redundancy and availability
- **Audit trails** - activity logging built into Google Sheets
- **Cost effective** - no additional database or storage costs

## Risk Mitigation - Collaboration Focus

**Development Infrastructure**: Set up robust testing and quality checks early to catch issues
**Mobile Performance**: Test early on actual devices, not just browser dev tools
**Code Quality**: Automated linting and testing prevent regressions
**Type Safety**: Strict TypeScript configuration catches errors at compile time

**Google API Rate Limits**: 
- Implement exponential backoff for API calls
- Use batch operations where possible (Sheets batch updates)
- Cache frequently accessed data locally
- Monitor quota usage and implement user feedback for limits

**Google Authentication & Security**:
- Handle token expiration gracefully with automatic refresh
- Implement proper scope management (request minimal required permissions)
- Add domain restrictions for enterprise security
- Handle revoked permissions and auth failures with clear user messaging

**Real-time Collaboration Challenges**:
- Polling-based sync has inherent latency (2-3 seconds) vs WebSocket (< 200ms)
- Google Sheets write conflicts require careful conflict resolution
- User presence tracking limited by polling frequency
- Activity log can grow large over time - implement cleanup strategies

**File Storage & Organization**:
- Google Drive API has file size limits (varies by account type)
- Folder structure can become complex with many projects
- File permissions must stay in sync with project permissions
- Media file uploads can fail on poor connections - implement retry logic

**Data Consistency & Backup**:
- Google Sheets doesn't have transactions - implement application-level consistency
- Version control relies on Drive's revision history as backup
- Large presentations may hit Google Sheets cell/row limits
- Implement data validation to prevent corruption

**Enterprise & Compliance**:
- Ensure Google Workspace admin policies don't conflict with app functionality
- GDPR compliance relies on Google's data handling policies
- Audit trails depend on Google's activity logging
- Data residency requirements must align with organization's Google Workspace setup

**Performance & Scalability**:
- Google Sheets performance degrades with large datasets (>10k rows)
- Concurrent user limits depend on Google API quotas, not just app design
- File search performance varies with Drive folder organization
- Consider Google Apps Script for server-side operations if needed

**Fallback Strategies**:
- Implement local storage backup for offline editing
- Provide manual sync options when auto-sync fails
- Export capabilities ensure data isn't locked in Google ecosystem
- Progressive enhancement: core features work without Google integration

**User Experience Considerations**:
- Google sign-in flow must be seamless across devices
- Permission errors need clear, actionable error messages
- File organization must be intuitive for non-technical users
- Sync status should be clearly visible to users

---

---

## Comprehensive Feature Dependencies

### Backend Requirements (for advanced features):
```json
{
  "collaboration": {
    "websocket-server": "Socket.io or native WebSocket",
    "user-management": "Authentication and authorization",
    "data-sync": "Operational transformation or CRDT",
    "file-storage": "Cloud storage for media files"
  },
  "analytics": {
    "data-warehouse": "Analytics data collection",
    "processing": "Real-time and batch processing",
    "privacy": "GDPR/CCPA compliant data handling"
  },
  "sharing": {
    "link-generation": "Secure shareable link service",
    "access-control": "Permission and expiration management",
    "file-hosting": "CDN for presentation delivery"
  }
}
```

### Third-party Services Integration:
- **Authentication**: Auth0, Firebase Auth, or custom OAuth
- **File Storage**: AWS S3, Google Cloud Storage, or Azure Blob
- **CDN**: CloudFlare, AWS CloudFront for global delivery
- **Analytics**: Custom solution or integration with Google Analytics
- **Error Tracking**: Sentry for production error monitoring
- **Performance**: New Relic or DataDog for monitoring

### Progressive Implementation Strategy:
1. **MVP (Phases 0-3)**: Core functionality, works entirely client-side
2. **Professional (Phases 4-5)**: Add backend for collaboration and advanced sharing
3. **Enterprise (Phase 6)**: Full analytics, templates, and advanced features

### Alternative Minimal Implementations:
- **Collaboration**: Start with simple link sharing before real-time features
- **Analytics**: Begin with client-side tracking before full backend
- **Templates**: Start with hard-coded templates before dynamic system
- **Audio**: Begin with simple recording before advanced editing features

---

## Google Workspace Setup Guide

### Prerequisites for Your Organization:
1. **Google Workspace Admin Access** - To configure OAuth and domain restrictions
2. **Google Cloud Project** - For API credentials and quota management
3. **Spreadsheet Setup** - Master collaboration spreadsheet for your organization
4. **Drive Folder Structure** - Organized folder hierarchy for presentations

### Step-by-Step Setup:

#### 1. Google Cloud Project Configuration
```bash
# Enable required APIs
gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable oauth2.googleapis.com
```

#### 2. OAuth 2.0 Setup
```typescript
// Configure OAuth in Google Cloud Console
const oauth2Config = {
  client_id: 'your-org-client-id.googleusercontent.com',
  project_id: 'your-org-project-id',
  redirect_uris: ['https://yourdomain.com/auth/callback'],
  javascript_origins: ['https://yourdomain.com'],
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  hosted_domain: 'yourcompany.com' // Restrict to organization domain
};
```

#### 3. Master Spreadsheet Creation
```typescript
// Create the collaboration master spreadsheet
const masterSpreadsheet = {
  title: 'Interactive Presentations - Collaboration Master',
  sheets: [
    {
      name: 'Projects',
      headers: ['Project ID', 'Title', 'Description', 'Owner', 'Collaborators', 'Drive File ID', 'Created At', 'Updated At', 'Status', 'Permissions']
    },
    {
      name: 'Activity', 
      headers: ['Timestamp', 'Project ID', 'User ID', 'Action', 'Slide Index', 'Details']
    },
    {
      name: 'Versions',
      headers: ['Version ID', 'Project ID', 'Drive File ID', 'Author', 'Timestamp', 'Description', 'Changes Summary']
    }
  ]
};
```

#### 4. Drive Folder Structure Setup
```typescript
// Create organization folder hierarchy
const folderStructure = {
  root: '[Your Org] - Interactive Presentations',
  subfolders: [
    'Active Projects',
    'Templates', 
    'Archived Projects',
    'Shared Media Assets'
  ]
};
```

#### 5. Environment Configuration
```env
# .env.local
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
COLLABORATION_SPREADSHEET_ID=1ABc-dEfGhIjKlMnOpQrStUvWxYz
PRESENTATIONS_FOLDER_ID=1ZyXwVuTsRqPoNmLkJiHgFeDcBa
ORGANIZATION_DOMAIN=yourcompany.com
```

#### 6. Permission Management
```typescript
// Set up default permissions for organization
const defaultPermissions = {
  organizationAccess: 'anyone-in-org', // Anyone in domain can view
  defaultRole: 'viewer',               // Default to viewer access
  escalationRoles: ['editor', 'owner'], // Available promotion levels
  adminOverride: true                  // Admins can access all projects
};
```

### Integration Testing Checklist:
- [ ] Google OAuth works with organization accounts
- [ ] Spreadsheet read/write operations complete successfully  
- [ ] Drive file upload/download functions correctly
- [ ] Domain restrictions enforce properly
- [ ] File permissions sync with Google Drive
- [ ] Rate limits are handled gracefully
- [ ] Error states provide clear user feedback

This setup provides a solid foundation for collaboration features while leveraging your existing Google Workspace infrastructure efficiently and securely.
