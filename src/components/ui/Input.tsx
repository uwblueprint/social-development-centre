"use client";

import { styled } from "next-yak";

export const Input = styled.input`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible,
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
    &:focus-visible,
    &:focus {
      box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-danger);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-surface);
  }
`;
