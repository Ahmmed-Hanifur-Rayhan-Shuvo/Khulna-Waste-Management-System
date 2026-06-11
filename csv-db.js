// csv-db.js - Complete CSV Database Handler
class CSVDatabase {
    constructor(dbName='wastewise_db'){
        this.dbName=dbName;
        this.tables={
            users:{columns:['id','name','email','password','type','phone','address','created_at','status'],data:[]},
            smart_bins:{columns:['id','name','location','lat','lng','fill_level','status','type','is_iot','last_updated'],data:[]},
            reports:{columns:['id','user_id','user_name','location','type','description','status','reported_at','lat','lng','collector_id','collected_at'],data:[]},
            tasks:{columns:['id','report_id','location','waste_type','status','assigned_to','assigned_at','lat','lng'],data:[]},
            fines:{columns:['id','user_id','user_name','location','amount','reason','issued_by','issued_at','status'],data:[]},
            proofs:{columns:['id','task_id','collector_id','notes','image','submitted_at'],data:[]},
            scans:{columns:['id','user_id','item','category','recyclable','confidence','timestamp'],data:[]}
        };
        this.loadAll();
        this.initSample();
    }
    loadAll(){for(let[t,info]of Object.entries(this.tables)){let s=localStorage.getItem(`${this.dbName}_${t}`);if(s)info.data=JSON.parse(s)}}
    save(t){localStorage.setItem(`${this.dbName}_${t}`,JSON.stringify(this.tables[t].data))}
    initSample(){
        let now=new Date().toISOString();
        if(this.tables.users.data.length===0){
            this.tables.users.data=[
                {id:1,name:'Rayhan Admin',email:'rayhan@wastewise.com',password:'rayhan123',type:'admin',phone:'01700000001',address:'Khulna City Corporation',created_at:now,status:'active'},
                {id:2,name:'Anisha Rahman',email:'anisha@email.com',password:'anisha123',type:'citizen',phone:'01811111111',address:'Sonadanga, Khulna',created_at:now,status:'active'},
                {id:3,name:'Asif Collector',email:'asif@email.com',password:'asif123',type:'collector',phone:'01922222222',address:'Gollamari, Khulna',created_at:now,status:'active',vehicleNo:'KHL-1234',assignedArea:'Gollamari'}
            ];
            this.save('users');
        }
        if(this.tables.smart_bins.data.length===0){
            this.tables.smart_bins.data=[
                {id:1,name:'ESP32 Smart Bin',location:'Sonadanga Market',lat:22.8345,lng:89.5512,fill_level:0,status:'normal',type:'Mixed',is_iot:1,last_updated:now},
                {id:2,name:'Smart Bin #2',location:'Gollamari Bus Stand',lat:22.8345,lng:89.5412,fill_level:45,status:'normal',type:'Recyclable',is_iot:0,last_updated:now},
                {id:3,name:'Smart Bin #3',location:'Khulna University',lat:22.9015,lng:89.5012,fill_level:92,status:'critical',type:'Mixed',is_iot:0,last_updated:now},
                {id:4,name:'Smart Bin #4',location:'City Center',lat:22.8456,lng:89.5400,fill_level:30,status:'normal',type:'Organic',is_iot:0,last_updated:now}
            ];
            this.save('smart_bins');
        }
        if(this.tables.reports.data.length===0){
            this.tables.reports.data=[{id:1,user_id:2,user_name:'Anisha Rahman',location:'Sonadanga',type:'Household',description:'Overflowing waste bin near market',status:'pending',reported_at:now,lat:22.8345,lng:89.5512,collector_id:null,collected_at:null}];
            this.save('reports');
        }
    }
    insert(t,d){let tb=this.tables[t];if(!tb)return null;let newId=tb.data.length>0?Math.max(...tb.data.map(r=>r.id))+1:1;let rec={id:newId,...d,created_at:new Date().toISOString()};tb.data.push(rec);this.save(t);return rec}
    selectAll(t){return[...this.tables[t].data]}
    selectWhere(t,c,v){return this.tables[t].data.filter(r=>r[c]==v)}
    selectOne(t,c,v){return this.tables[t].data.find(r=>r[c]==v)||null}
    update(t,id,u){let tb=this.tables[t];let idx=tb.data.findIndex(r=>r.id==id);if(idx===-1)return null;tb.data[idx]={...tb.data[idx],...u,updated_at:new Date().toISOString()};this.save(t);return tb.data[idx]}
    delete(t,id){let tb=this.tables[t];let len=tb.data.length;tb.data=tb.data.filter(r=>r.id!=id);if(tb.data.length!==len){this.save(t);return true}return false}
    exportToCSV(t){
        let tb=this.tables[t];if(!tb||tb.data.length===0)return '';
        let headers=tb.columns.join(',');
        let rows=tb.data.map(r=>tb.columns.map(c=>{let v=r[c];if(v===undefined||v===null)v='';if(typeof v==='string'&&(v.includes(',')||v.includes('"')))v=`"${v.replace(/"/g,'""')}"`;return v}).join(','));
        return[headers,...rows].join('\n');
    }
    downloadCSV(t){
        let csv=this.exportToCSV(t);if(!csv){if(window.showNotification)window.showNotification('No data','warning');return}
        let blob=new Blob([csv],{type:'text/csv'});let link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${t}_${new Date().toISOString().slice(0,19)}.csv`;link.click();URL.revokeObjectURL(link.href);if(window.showNotification)window.showNotification(`${t} exported!`,'success')
    }
    downloadAll(){Object.keys(this.tables).forEach(t=>this.downloadCSV(t))}
    async importFromCSV(t,f){
        return new Promise((res,rej)=>{let rd=new FileReader();rd.onload=e=>{
            let lines=e.target.result.split('\n');let headers=lines[0].split(',');let data=[];
            for(let i=1;i<lines.length;i++)if(lines[i].trim()){let vals=this.parseCSVLine(lines[i]);let row={};headers.forEach((h,idx)=>{row[h.trim()]=vals[idx]});data.push(row)}
            this.tables[t].data=data;this.save(t);res(data.length)
        };rd.onerror=rej;rd.readAsText(f)})
    }
    parseCSVLine(l){let res=[],inq=false,cur='';for(let i=0;i<l.length;i++){let c=l[i];if(c==='"')inq=!inq;else if(c===','&&!inq){res.push(cur);cur=''}else cur+=c}res.push(cur);return res}
    getNextId(t){let tb=this.tables[t];return tb.data.length>0?Math.max(...tb.data.map(r=>r.id))+1:1}
}
const db=new CSVDatabase();
function exportUsersCSV(){db.downloadCSV('users')}
function exportBinsCSV(){db.downloadCSV('smart_bins')}
function exportReportsCSV(){db.downloadCSV('reports')}
function exportTasksCSV(){db.downloadCSV('tasks')}
function exportFinesCSV(){db.downloadCSV('fines')}
function exportAllCSV(){db.downloadAll()}
async function importCSVData(){let f=document.getElementById('csvImportFile')?.files[0];let t=document.getElementById('csvImportTable')?.value;if(!f){if(window.showNotification)window.showNotification('Select a CSV file','error');return}let c=await db.importFromCSV(t,f);if(window.showNotification)window.showNotification(`Imported ${c} records!`,'success');setTimeout(()=>location.reload(),1000)}
