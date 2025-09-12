declare module 'html-to-docx' {
  interface Options {
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
    footer?: boolean;
    pageNumber?: boolean;
    font?: string;
    fontSize?: number;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }

  function HTMLtoDOCX(
    html: string,
    headerHTML?: string | null,
    options?: Options
  ): Promise<ArrayBuffer>;

  export = HTMLtoDOCX;
}