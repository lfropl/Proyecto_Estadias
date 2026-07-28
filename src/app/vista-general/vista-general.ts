import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ClienteLocal, ClientesService } from '../clientes-service';
import { FlotaService, OperadorLocal, TipoCaja, VehiculoLocal } from '../flota-service';
import { GestionFlota } from '../gestion-flota/gestion-flota';
import { LoginService } from '../login-service';
import { Facturacion } from '../facturacion/facturacion';
import { Cobranza } from '../cobranza/cobranza';
import { Mantenimiento } from '../mantenimiento/mantenimiento';
import { RecursosHumanos } from '../recursos-humanos/recursos-humanos';
import { Clientes } from '../clientes/clientes';
import { Usuarios } from '../usuarios/usuarios';
import { ServiciosViajeService } from '../servicios-viaje.service';
import type { ArchivoAdjunto, ComentarioViaje, Estatus, RecoleccionSeguimiento, ViajeRow } from '../viaje.model';
import { Subscription, filter } from 'rxjs';
import { InactivityService } from '../services/inactivity.service';
import { ActivityDetector } from '../services/activity.detector';
import { SessionService } from '../services/session.service';

export type { ArchivoAdjunto, ComentarioViaje, Estatus, RecoleccionSeguimiento, ViajeRow } from '../viaje.model';

export interface NavItem { id: string; label: string; ruta: string; roles?: string[]; }
export interface EstatusOpcion { id: Estatus; label: string; }
export type TipoUnidad = 'tracto' | 'camioneta' | 'van' | 'rabon' | 'torton';
export type RegistroTipoCaja = 'thermo' | 'seca';
export interface RegistroServicioRow {
  id: string; eta: string; origen: string; destino: string; clienteId: string;
}

@Component({
  selector: 'app-vista-general',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, GestionFlota, RecursosHumanos, Facturacion, Cobranza, Mantenimiento, Clientes, Usuarios],
  templateUrl: './vista-general.html', styleUrls: ['./vista-general.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaGeneral implements OnInit, OnDestroy {
  private readonly maxArchivoBytes = 1_500_000; private readonly maxAdjuntos = 3;
  clientes: ClienteLocal[] = []; vehiculosActivos: VehiculoLocal[] = []; operadoresActivos: OperadorLocal[] = [];
  private flotaSub = Subscription.EMPTY; private operadoresSub = Subscription.EMPTY; private routerSub = Subscription.EMPTY; private viajesSyncSub = Subscription.EMPTY;
  private nextRegistroId = 1; private nextServicioId = 1;

  get unidadesDisponibles(): VehiculoLocal[] { return this.vehiculosActivos.filter(v => v.tipo !== 'caja'); }

  allNavItems: NavItem[] = [
    { id: 'gestion-flota', label: 'Gestion de flota', ruta: '/gestion-flota', roles: ['Administrador','Operaciones','Mantenimiento'] },
    { id: 'recursos-humanos', label: 'Recursos humanos', ruta: '/recursos-humanos', roles: ['Administrador'] },
    { id: 'clientes', label: 'Clientes', ruta: '/clientes', roles: ['Administrador','Operaciones','Administrativo'] },
    { id: 'facturacion', label: 'Facturacion', ruta: '/facturacion', roles: ['Administrador','Administrativo'] },
    { id: 'cobranza', label: 'Cobranza', ruta: '/cobranza', roles: ['Administrador','Administrativo'] },
    { id: 'mantenimiento', label: 'Mantenimiento', ruta: '/mantenimiento', roles: ['Administrador','Mantenimiento'] },
    { id: 'usuarios', label: 'Usuarios', ruta: '/usuarios', roles: ['Administrador'] },
  ];
  get navItems(): NavItem[] {
    const sesion = this.loginService.obtenerSesionActiva();
    return this.allNavItems.filter(item => (item.roles||[]).includes(sesion?.puesto || ''));
  }

  estatusOpciones: EstatusOpcion[] = [{id:'rojo',label:'Detenido'},{id:'amarillo',label:'En ruta'},{id:'verde',label:'Terminado'}];
  seccionActiva = 'general'; generalExpanded = false; modalLogoutAbierto = false; registroErrorMsg = '';
  notificaciones: {id:string;mensaje:string;tipo:'ok'|'error'}[] = [];
  registroServicios: RegistroServicioRow[] = [this.crearFilaRegistro()];
  serviciosGeneral: ViajeRow[] = []; viajeDetalleId: string|null = null; comentarioDetalleInput = '';

  get viajeDetalle(): ViajeRow|null { return this.serviciosGeneral.find(v=>v.id===this.viajeDetalleId)??null; }
  get tituloSeccion(): string { if(this.seccionActiva==='general')return'General';if(this.seccionActiva==='registro-servicios')return'Registro de servicios';const i=this.navItems.find(n=>n.id===this.seccionActiva);return i?.label??'General'; }

  readonly opcionesRecoleccion = [1,2,3,4,5];
  private readonly clientesService = inject(ClientesService);
  private readonly flotaService = inject(FlotaService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly serviciosViaje = inject(ServiciosViajeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly inactivityService = inject(InactivityService);
  private readonly activityDetector = inject(ActivityDetector);
  private readonly sessionService = inject(SessionService);

  constructor() {
    this.flotaSub = this.flotaService.vehiculos$.subscribe(v=>{this.vehiculosActivos=v;});
    this.operadoresSub = this.flotaService.operadores$.subscribe(o=>{this.operadoresActivos=o;});
    if(!this.loginService.haySesionActiva()) this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.clientes = await this.clientesService.obtenerClientes();
    this.vehiculosActivos = await this.flotaService.obtenerVehiculos();
    this.operadoresActivos = await this.flotaService.obtenerOperadores();
    this.serviciosGeneral = await this.serviciosViaje.obtenerLista();
    this.actualizarSeccionDesdeRuta(this.router.url); this.cdr.detectChanges();
    this.routerSub = this.router.events.pipe(filter((e):e is NavigationEnd=>e instanceof NavigationEnd)).subscribe(e=>{this.actualizarSeccionDesdeRuta(e.urlAfterRedirects);this.cdr.markForCheck();});
    this.viajesSyncSub = this.serviciosViaje.obtenerViajes$().subscribe(v=>{this.serviciosGeneral=v;this.cdr.markForCheck();});
  }

  seleccionarSeccion(id:string){ const i=this.navItems.find(n=>n.id===id); if(!i)return; this.seccionActiva=i.id;this.cdr.markForCheck();this.router.navigateByUrl(i.ruta); }
  irAGeneral(){ this.seccionActiva='general';this.cdr.markForCheck();this.router.navigate(['/vista-general']); }
  toggleGeneralExpanded(){ this.generalExpanded=!this.generalExpanded;this.cdr.markForCheck(); }
  abrirModalLogout(){ this.modalLogoutAbierto=true;this.cdr.markForCheck(); }
  cerrarModalLogout(){ this.modalLogoutAbierto=false;this.cdr.markForCheck(); }
  confirmarLogout(){ this.modalLogoutAbierto=false;this.cdr.markForCheck();this.loginService.cerrarSesion();this.sessionService.destroySession();this.inactivityService.stopInactivityTimer();this.activityDetector.stopDetectingActivity();this.router.navigate(['/login']); }
  logout(){ this.abrirModalLogout(); }
  irARegistroServicios(){ this.generalExpanded=true;this.seccionActiva='registro-servicios';this.cdr.markForCheck();this.router.navigate(['/registro-servicios']); }
  agregarFilaRegistro(){ this.registroServicios=[...this.registroServicios,this.crearFilaRegistro()]; }
  eliminarFilaRegistro(id:string){ this.registroServicios=this.registroServicios.filter(r=>r.id!==id); }
  cajasDisponibles(t:TipoCaja|''){ return this.vehiculosActivos.filter(v=>v.tipo==='caja'&&(!t||v.tipoCaja===t)); }
  prefijoCaja(t:RegistroTipoCaja){ return t==='thermo'?'TH':'20'; }
  cajaNumeroValido(row:RegistroServicioRow){ return true; } onUnidadDetalleChange(v:ViajeRow){ const u=this.unidadesDisponibles.find(x=>x.numeroEconomico===v.unidad); if(u){ (v as any).tipoUnidad=u.tipo; } }

  registrarServicios(){
    this.registroErrorMsg='';
    const errores=this.registroServicios.map((r,i)=>this.validarFilaRegistro(r,i)).filter((e):e is string=>!!e);
    if(errores.length){ this.registroErrorMsg=errores[0];return; }
    const nuevos=this.registroServicios.map(r=>this.mapearServicioPanel(r)).filter((i):i is ViajeRow=>i!==null);
    if(!nuevos.length)return;
    this.serviciosGeneral=[...nuevos,...this.serviciosGeneral];
    this.persistirServiciosGeneral();
    this.registroServicios=[this.crearFilaRegistro()];
    this.seccionActiva='general';
    this.mostrarPopup('Servicio registrado exitosamente.');
  }

  actualizarEstatus(v:ViajeRow,e:Estatus){ if(v.archivosAdjuntos.length>0&&e!=='verde'){this.mostrarNotificacion('No se puede bajar estatus: el POD ya fue entregado.','error');v.estatus='verde';return;}v.estatus=e;this.persistirServiciosGeneral(); }
  abrirDetalle(v:ViajeRow){ this.viajeDetalleId=v.id; }
  cerrarDetalle(){ this.viajeDetalleId=null; }

  agregarRecoleccionDetalle(){
    const v=this.viajeDetalle; if(!v)return;
    const ultimo=v.seguimientos[v.seguimientos.length-1];
    const e=ultimo?.etaCarga??'';
    v.seguimientos=[...v.seguimientos,this.crearSeguimientoRecoleccion('','',e)];
  }
  quitarRecoleccionDetalle(i:number){
    const v=this.viajeDetalle; if(!v)return;
    if(v.seguimientos.length<=1)return;
    v.seguimientos=v.seguimientos.filter((_,x)=>x!==i);
  }

  guardarDetalle(){
    const v=this.viajeDetalle; if(!v)return;
    v.nombre=v.servicio.trim()||v.nombre;
    if(this.totalArchivosDetalle(v)>0) v.estatus='verde';
    this.persistirServiciosGeneral();
    this.mostrarPopup('Detalle del servicio actualizado.');
  }

  agregarComentarioDetalle(){
    const v=this.viajeDetalle; if(!v)return;
    const m=this.comentarioDetalleInput.trim(); if(!m){this.registroErrorMsg='Escribe un comentario antes de enviarlo.';return;}
    const a=this.loginService.obtenerSesionActiva();
    const c:ComentarioViaje={id:`cmt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,autorNombre:a?`${a.nombre} ${a.apellido}`.trim():'Usuario',autorPuesto:a?.puesto||'Sin puesto',mensaje:m,fechaIso:new Date().toISOString()};
    v.comentarios=[...v.comentarios,c]; v.observaciones=v.comentarios.map(c=>`${c.autorNombre}: ${c.mensaje}`).join('\n');
    this.comentarioDetalleInput='';this.registroErrorMsg='';this.persistirServiciosGeneral();
  }

  formatoFechaComentario(f:string){ const d=new Date(f);if(Number.isNaN(d.getTime()))return f;return d.toLocaleString('es-MX',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
  diferenciaEtaLlegadaCarga(s:RecoleccionSeguimiento){if(!s.etaCarga||!s.llegadaCarga)return'Sin datos';const e=new Date(s.etaCarga),l=new Date(s.llegadaCarga);if(Number.isNaN(e.getTime())||Number.isNaN(l.getTime()))return'Sin datos';const d=Math.round((l.getTime()-e.getTime())/60000),si=d>=0?'+':'-',a=Math.abs(d),h=Math.floor(a/60),m=a%60;return a<60?`${si}${m} min`:`${si}${h}h ${m}m`;}
  diferenciaEtaLlegadaDescarga(s:RecoleccionSeguimiento){if(!s.etaDescarga||!s.llegadaDescarga)return'Sin datos';const e=new Date(s.etaDescarga),l=new Date(s.llegadaDescarga);if(Number.isNaN(e.getTime())||Number.isNaN(l.getTime()))return'Sin datos';const d=Math.round((l.getTime()-e.getTime())/60000),si=d>=0?'+':'-',a=Math.abs(d),h=Math.floor(a/60),m=a%60;return a<60?`${si}${m} min`:`${si}${h}h ${m}m`;}
  esDiferenciaNegativa(v:string){return v.trim().startsWith('-');}

  onArchivosSeleccionadosDetalle(e:Event,c:'general'|'cartaPorte'='general'){const v=this.viajeDetalle;if(!v)return;const i=e.target as HTMLInputElement|null;const f=Array.from(i?.files??[]);if(!f.length)return;if(this.listaArchivosPorCategoria(v,c).length+f.length>this.maxAdjuntos){this.registroErrorMsg=`Solo se permiten ${this.maxAdjuntos} archivos por servicio.`;if(i)i.value='';return;}if(f.find(f=>!this.esTipoAdjuntoValido(f.type))){this.registroErrorMsg='Archivo no valido. Solo PDF o imagenes.';if(i)i.value='';return;}if(f.find(f=>f.size>this.maxArchivoBytes)){this.registroErrorMsg='El archivo excede 1.5 MB.';if(i)i.value='';return;}Promise.all(f.map(f=>this.leerArchivoBase64(f))).then(a=>{if(c==='general')v.archivosAdjuntos=[...v.archivosAdjuntos,...a];else v.archivosCartaPorte=[...v.archivosCartaPorte,...a];if(this.totalArchivosDetalle(v)>0)v.estatus='verde';this.registroErrorMsg='';this.persistirServiciosGeneral();}).catch(()=>{this.registroErrorMsg='Ocurrio un error al cargar los archivos.';}).finally(()=>{if(i)i.value='';});}
  quitarArchivoDetalle(i:number,c:'general'|'cartaPorte'='general'){const v=this.viajeDetalle;if(!v)return;if(c==='general')v.archivosAdjuntos=v.archivosAdjuntos.filter((_,x)=>x!==i);else v.archivosCartaPorte=v.archivosCartaPorte.filter((_,x)=>x!==i);this.persistirServiciosGeneral();}
  verArchivo(a:ArchivoAdjunto){if(!a.base64)return;const b=this.base64ToBlob(a.base64,a.mime||'application/octet-stream');const u=URL.createObjectURL(b);if(typeof window!=='undefined'){window.open(u,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(u),15000);}}
  archivosDisponiblesRestantes(v:ViajeRow){return this.maxAdjuntos-v.archivosAdjuntos.length;}
  archivosDisponiblesCartaPorte(v:ViajeRow){return this.maxAdjuntos-v.archivosCartaPorte.length;}
  obtenerIndiceRecoleccion(v:ViajeRow,s:RecoleccionSeguimiento){return v.seguimientos.findIndex(x=>x===s)+1;}
  primerSeguimiento(v:ViajeRow){return v.seguimientos[0]??null;}

  private validarFilaRegistro(r:RegistroServicioRow,i:number):string|null{
    const p=`Fila ${i+1}:`;
    if(!r.eta)return`${p} captura la ETA.`;
    if(!r.origen.trim())return`${p} captura el origen.`;
    if(!r.destino.trim())return`${p} captura el destino.`;
    if(!r.clienteId)return`${p} selecciona el cliente.`;
    return null;
  }

  private mostrarPopup(m:string){ this.mostrarNotificacion(m,'ok'); }
  cerrarNotificacion(id:string){ this.notificaciones=this.notificaciones.filter(n=>n.id!==id); }
  private mostrarNotificacion(m:string,t:'ok'|'error'){ const id=`ntf-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;this.notificaciones=[{id,mensaje:m,tipo:t},...this.notificaciones]; }
  private esTipoAdjuntoValido(m:string){return m==='application/pdf'||m.startsWith('image/');}
  private leerArchivoBase64(f:File):Promise<ArchivoAdjunto>{return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const v=r.result;if(typeof v!=='string'){rej();return;}const b=v.includes(',')?v.split(',')[1]:'';if(!b){rej();return;}res({nombre:f.name,mime:f.type||'application/octet-stream',base64:b});};r.onerror=()=>rej();r.readAsDataURL(f);});}
  private crearSeguimientoRecoleccion(o:string,d:string,e:string):RecoleccionSeguimiento{return{origen:o,destino:d,etaCarga:e,llegadaCarga:'',ingresoCarga:'',horaCarga:'',salidaCarga:'',etaDescarga:'',llegadaDescarga:'',ingresoDescarga:'',horaDescarga:'',salidaDescarga:''};}

  private mapearServicioPanel(r:RegistroServicioRow):ViajeRow|null{
    const cli=this.clientes.find(c=>c.id===r.clienteId)?.nombre??'Sin cliente';
    const svc=`${r.origen} -> ${r.destino} - ${cli}`;
    const ruta=`${r.origen} -> ${r.destino}`;
    const seg=this.crearSeguimientoRecoleccion(r.origen,r.destino,r.eta);
    return {
      id:`srv-${this.nextServicioId++}`,nombre:svc,unidad:'',operador:'',servicio:svc,ruta,nota:`${cli}`,estatus:'amarillo',
      etaCarga:r.eta,llegadaCarga:'',ingresoCarga:'',horaCarga:'',salidaCarga:'',
      etaDescarga:'',llegadaDescarga:'',ingresoDescarga:'',horaDescarga:'',salidaDescarga:'',
      cliente:cli,referencia:'',observaciones:'',comentarios:[],seguimientos:[seg],
      archivosAdjuntos:[],archivosCartaPorte:[],facturaPdf:null,reportePagoPdf:null,
      costoServicio:0,gastos:[],cobranzaTerminada:false,
    };
  }

  private crearFilaRegistro():RegistroServicioRow{ return{id:`rs-${this.nextRegistroId++}`,eta:'',origen:'',destino:'',clienteId:''}; }
  private persistirServiciosGeneral(){ this.serviciosViaje.persistirLista(this.serviciosGeneral); }
  private base64ToBlob(b:string,m:string){const a=atob(b);const l=new Uint8Array(a.length);for(let i=0;i<a.length;i++)l[i]=a.charCodeAt(i);return new Blob([l],{type:m});}
  private listaArchivosPorCategoria(v:ViajeRow,c:'general'|'cartaPorte'){return c==='general'?v.archivosAdjuntos:v.archivosCartaPorte;}
  private totalArchivosDetalle(v:ViajeRow){return v.archivosAdjuntos.length+v.archivosCartaPorte.length;}

  async resetFiltro(){ this.seccionActiva='general';this.viajeDetalleId=null;await this.serviciosViaje.limpiarTodo();this.serviciosGeneral=await this.serviciosViaje.obtenerLista();this.registroErrorMsg=''; }
  ngOnDestroy(){ this.flotaSub.unsubscribe();this.operadoresSub.unsubscribe();this.routerSub.unsubscribe();this.viajesSyncSub.unsubscribe(); }

  private actualizarSeccionDesdeRuta(u:string){ const sq=u.split('?')[0]??'';const ph=sq.split('#');const c=ph.length>1&&ph[1]?ph[1]:ph[0];const p=c.split('/').filter(Boolean);const s=p[p.length-1]??'';if(!s||s==='vista-general'){this.seccionActiva='general';this.cdr.markForCheck();return;}if(s==='registro-servicios'){this.generalExpanded=true;this.seccionActiva='registro-servicios';this.cdr.markForCheck();return;}const i=this.navItems.find(n=>n.id===s);if(i){this.seccionActiva=i.id;this.cdr.markForCheck();return;}this.seccionActiva='general';this.cdr.markForCheck(); }
}