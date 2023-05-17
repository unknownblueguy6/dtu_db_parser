import { PdfReader } from "pdfreader";

type PDFSource = string | Buffer;
type PDFToken = {
    text: string,
    coords: Coords
};

abstract class PDFParser{
    private pageNum: number = 0;
    private pdf: PDFSource;
    private pages: Array<Array<PDFToken>> = []; 
    private pageData: Array<PDFToken> = [];
    
    constructor(pdf: PDFSource){
        this.pdf = pdf;
    }
    
    abstract parsePage(page: Array<PDFToken>): void;
    
    itemCallback(err: Error, item: any, resolve: any, reject: any){
        if (!item){
            this.pages.push(this.pageData)
            this.pageData = [];
            resolve()
            return;
        }

        else if (item.page){
            this.pageNum = item.page;
            if (this.pageData.length){
                this.pages.push(this.pageData)
                this.pageData = [];
            }
        }

        else if (item.text){
            this.pageData.push({text: item.text.trim(), coords: {x: item.x, y: item.y}});
        }

        else if (err) reject(console.error("error:", err));
    } 

    async readPDF(){
        const reader = new PdfReader();
        let parser: (pdf: PDFSource, callback_fn: (err: Error, item: any) => void) => void; 

        if (typeof this.pdf === 'string'){
            parser = reader.parseFileItems.bind(reader)
        }
        else{
            parser = reader.parseBuffer.bind(reader)
        }

        return new Promise<void>((resolve, reject) => {
            parser(this.pdf, (err, item) => {
                this.itemCallback(err, item, resolve, reject);
            });
        });
    }

    async parsePages(){
        return new Promise<void>((resolve) => {
            this.pages.forEach((page, i) => {
                this.parsePage(page)
            });
            resolve();
        }) 
    }

}

export {
    PDFSource,
    PDFToken,
    PDFParser
}