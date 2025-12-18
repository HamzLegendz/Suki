export interface ButtonParams {
  id?: string;
  text?: string;
  displayText?: string;
  name?: string;
  buttonParamsJson?: string;
  buttonId?: string;
  buttonText?: {
    displayText: string;
  };
}

export interface ListRow {
  title: string;
  description?: string;
  rowId?: string;
  id?: string;
}

export interface ListSection {
  title?: string;
  rows: ListRow[];
}

export interface SendButtonOptions {
  footer?: string;
  title?: string;
  subtitle?: string;
  image?: Buffer | string | { url: string };
  video?: Buffer | string | { url: string };
  document?: Buffer | string | { url: string };
  useAI?: boolean;
  additionalNodes?: any[];
  additionalAttributes?: any;
  useCachedGroupMetadata?: boolean;
  statusJidList?: string[];
  [key: string]: any;
}

export interface SendListOptions {
  footer?: string;
  title?: string;
  [key: string]: any;
}

export interface InteractiveMessageContent {
  text?: string;
  caption?: string;
  footer?: string;
  title?: string;
  subtitle?: string;
  interactiveButtons?: ButtonParams[];
  image?: Buffer | string | { url: string };
  video?: Buffer | string | { url: string };
  document?: Buffer | string | { url: string };
  [key: string]: any;
}
