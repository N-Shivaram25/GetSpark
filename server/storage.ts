import { type Keyword, type InsertKeyword, type ImgKeyMapping, type InsertImgKeyMapping } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Keywords
  getKeywords(): Promise<Keyword[]>;
  addKeyword(keyword: InsertKeyword): Promise<Keyword>;
  markKeywordUsed(id: string): Promise<void>;
  clearKeywords(): Promise<void>;
  
  // Img Key Mappings
  getImgKeyMappings(): Promise<ImgKeyMapping[]>;
  addImgKeyMapping(mapping: InsertImgKeyMapping): Promise<ImgKeyMapping>;
  deleteImgKeyMapping(id: string): Promise<void>;
  
  // Image storage
  saveImage(buffer: Buffer, filename: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private keywords: Map<string, Keyword>;
  private imgKeyMappings: Map<string, ImgKeyMapping>;
  private images: Map<string, Buffer>;

  constructor() {
    this.keywords = new Map();
    this.imgKeyMappings = new Map();
    this.images = new Map();
  }

  async getKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async addKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const id = randomUUID();
    const keyword: Keyword = { ...insertKeyword, id, used: false };
    this.keywords.set(id, keyword);
    return keyword;
  }

  async markKeywordUsed(id: string): Promise<void> {
    const keyword = this.keywords.get(id);
    if (keyword) {
      keyword.used = true;
      this.keywords.set(id, keyword);
    }
  }

  async clearKeywords(): Promise<void> {
    this.keywords.clear();
  }

  async getImgKeyMappings(): Promise<ImgKeyMapping[]> {
    return Array.from(this.imgKeyMappings.values());
  }

  async addImgKeyMapping(insertMapping: InsertImgKeyMapping): Promise<ImgKeyMapping> {
    const id = randomUUID();
    const mapping: ImgKeyMapping = { ...insertMapping, id };
    this.imgKeyMappings.set(id, mapping);
    return mapping;
  }

  async deleteImgKeyMapping(id: string): Promise<void> {
    this.imgKeyMappings.delete(id);
  }

  async saveImage(buffer: Buffer, filename: string): Promise<string> {
    const id = randomUUID();
    const extension = filename.split('.').pop() || 'jpg';
    const savedFilename = `${id}.${extension}`;
    this.images.set(savedFilename, buffer);
    return `/api/images/${savedFilename}`;
  }
}

export const storage = new MemStorage();
