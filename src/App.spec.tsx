/**
 * Smoke tests: verify the app and key components render without crashing.
 * Colocated with App; uses .spec.tsx for component tests per repo pattern.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import App from './App';
import Modal from './components/Modal';
import TodateForm from './components/TodateForm';
import type { TodateType, TagsType } from './types';

afterEach(cleanup);

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <div id="root">
        <App />
      </div>
    );
    expect(container.querySelector('#root')).toBeTruthy();
  });

  it('renders app title', () => {
    render(
      <div id="root">
        <App />
      </div>
    );
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByText('Todate')).toBeDefined();
  });
});

describe('Modal', () => {
  it('renders without crashing', () => {
    render(
      <Modal title="Test" closeFn={(): void => { return; }}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Test')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });
});

describe('TodateForm', () => {
  const noop = (): void => { return; };
  const tags: TagsType = {};
  const addTodate = (t: TodateType) => { void t; };

  it('renders without crashing', () => {
    const { container } = render(
      <TodateForm
        tags={tags}
        addTodate={addTodate}
        toggleTagModal={noop}
        schoolStartDate={null}
      />
    );
    expect(within(container).getByPlaceholderText('Enter title')).toBeDefined();
  });

  it('renders in compact mode', () => {
    const { container } = render(
      <TodateForm
        tags={tags}
        addTodate={addTodate}
        toggleTagModal={noop}
        schoolStartDate={null}
        compact
      />
    );
    expect(within(container).getByPlaceholderText('Enter title')).toBeDefined();
  });
});
