import { describe, expect, it } from 'vitest';
import { LocalWatchlistRepository, type StorageLike } from './storage';
class MemoryStorage implements StorageLike {
  data = new Map<string,string>();
  getItem(key:string) { return this.data.get(key) ?? null; }
  setItem(key:string,value:string) { this.data.set(key,value); }
}
const allowed=['DEMO1','DEMO2'];
describe('LocalWatchlistRepository',()=>{
 it('migrates legacy symbol arrays and writes the versioned envelope',()=>{
  const storage=new MemoryStorage();storage.setItem('zi-watchlist','["DEMO1","UNKNOWN","DEMO1"]');
  const repo=new LocalWatchlistRepository(storage);
  expect(repo.loadSymbols(allowed)).toEqual(['DEMO1']);
  repo.saveSymbols(['DEMO1','DEMO2']);
  expect(JSON.parse(storage.getItem('zi-watchlist')!).version).toBe(2);
  expect(repo.loadSymbols(allowed)).toEqual(['DEMO1','DEMO2']);
 });
 it('migrates legacy research notes and validates status and note length',()=>{
  const storage=new MemoryStorage();storage.setItem('zi-watchlist-research',JSON.stringify({DEMO1:{status:'Completed',notes:'hello'},UNKNOWN:{status:'Completed',notes:'x'}}));
  const repo=new LocalWatchlistRepository(storage);
  expect(repo.loadResearch(allowed)).toEqual({DEMO1:{status:'Completed',notes:'hello'}});
  repo.saveResearch({DEMO1:{status:'invalid' as never,notes:'x'.repeat(6000)}},allowed);
  const saved=repo.loadResearch(allowed);
  expect(saved.DEMO1.status).toBe('To review');
  expect(saved.DEMO1.notes).toHaveLength(5000);
 });
 it('ignores malformed JSON and invalid top-level values',()=>{
  const storage=new MemoryStorage();const repo=new LocalWatchlistRepository(storage);
  storage.setItem('zi-watchlist','{bad json');storage.setItem('zi-watchlist-research','[]');
  expect(repo.loadSymbols(allowed)).toEqual([]);
  expect(repo.loadResearch(allowed)).toEqual({});
 });
 it('continues safely when browser storage throws',()=>{
  const broken:StorageLike={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
  const repo=new LocalWatchlistRepository(broken);
  expect(repo.loadSymbols(allowed)).toEqual([]);
  expect(repo.loadResearch(allowed)).toEqual({});
  expect(()=>repo.saveSymbols(['DEMO1'])).not.toThrow();
  expect(()=>repo.saveResearch({},allowed)).not.toThrow();
 });
});
