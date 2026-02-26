/**
 * Tests for DatasetsPanel: collapsible left sidebar wrapping DatasetsView.
 * Panel is controlled via isCollapsed; toggle lives in TimelineWorkspace.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';

afterEach(cleanup);

import DatasetsPanel from './DatasetsPanel';
import type { Store } from '../types';

function makeStore(): Store {
  const id = 'ds-1';
  return {
    activeId: id,
    datasets: {
      [id]: {
        id,
        name: 'Default',
        todates: {},
        tags: {},
        schoolStartDate: null,
      },
    },
  };
}

const noop = (): void => { return; };
const handlers = {
  onAddDataset: noop,
  onOpenDataset: noop,
  onRenameDataset: noop,
  onDeleteDataset: noop,
  onExportAll: noop,
  onExportDataset: noop,
  onImport: noop,
  onImportStrategy: noop,
  onCloseImport: noop,
  onSaveToDrive: noop,
  onLoadFromDrive: noop,
};

function TestWrapper() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setCollapsed((c) => !c)} data-testid="datasets-panel-toggle">
        Toggle
      </button>
      <DatasetsPanel
        store={makeStore()}
        isCollapsed={collapsed}
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    </>
  );
}

describe('DatasetsPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <DatasetsPanel
        store={makeStore()}
        isCollapsed={false}
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    );
    expect(container).toBeTruthy();
  });

  it('shows DatasetsView content when expanded', () => {
    render(
      <DatasetsPanel
        store={makeStore()}
        isCollapsed={false}
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    );
    expect(screen.getByRole('button', { name: 'Create new line' })).toBeDefined();
  });

  it('hides content when collapsed', () => {
    render(
      <DatasetsPanel
        store={makeStore()}
        isCollapsed
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    );
    expect(screen.queryByRole('button', { name: 'Create new line' })).toBeNull();
  });

  it('toggle toggles collapse state', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('datasets-panel-resize')).toBeDefined();
    fireEvent.click(screen.getByTestId('datasets-panel-toggle'));
    expect(screen.queryByTestId('datasets-panel-resize')).toBeNull();
    fireEvent.click(screen.getByTestId('datasets-panel-toggle'));
    expect(screen.getByTestId('datasets-panel-resize')).toBeDefined();
  });

  it('resize handle is visible when expanded, hidden when collapsed', () => {
    const { rerender } = render(
      <DatasetsPanel
        store={makeStore()}
        isCollapsed={false}
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    );
    expect(screen.getByTestId('datasets-panel-resize')).toBeDefined();
    rerender(
      <DatasetsPanel
        store={makeStore()}
        isCollapsed
        {...handlers}
        pendingImport={null}
        importError={null}
        driveSyncAvailable={false}
        driveMessage={null}
      />
    );
    expect(screen.queryByTestId('datasets-panel-resize')).toBeNull();
  });
});
