declare module 'pdf-parse' {
  interface Result {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  interface Options {
    pagerender?: (pageData: any) => string;
    max?: number;
  }

  function pdfParse(dataBuffer: Buffer, options?: Options): Promise<Result>;
  
  export default pdfParse;
}