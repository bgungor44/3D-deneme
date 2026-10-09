"""Ebru anatomy model. Blender 4.5: --background --python blender/build_bra.py

Retopologizes the supplied Tripo-derived cup surfaces by ray projection.
Bands, straps, stitches, wire channels and the hook-and-eye closure are authored
here as separate, editable objects. No Tripo credit or API key is required.
"""
import bpy, math, os, json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from math import sin, cos, pi

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'models','ebru-anatomy.glb')
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'models','sutyen.glb'))
source=next(o for o in bpy.data.objects if o.type=='MESH')
verts=[source.matrix_world@v.co for v in source.data.vertices]
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in source.data.polygons])
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
for m in list(bpy.data.materials): bpy.data.materials.remove(m,do_unlink=True)
scene=bpy.context.scene
garment=bpy.data.collections.new('EBRU — editable garment');scene.collection.children.link(garment)
groups={}
def group(name,pid,delta):
 o=bpy.data.objects.new('part_'+name,None);garment.objects.link(o)
 o['partId']=pid;o['explode']=list(delta);groups[name]=o;return o
for name,pid,d in [('cup_L','cup',(-.15,-.12,.07)),('cup_R','cup',(.15,-.12,.07)),('wire','wire',(0,-.06,-.1)),('bow','bow',(0,-.22,.02)),('strap_L','strap',(-.11,.03,.24)),('strap_R','strap',(.11,.03,.24)),('wing_L','wing',(-.19,.12,0)),('wing_R','wing',(.19,.12,0)),('band','band',(0,.02,-.2)),('hook','hook',(0,.26,0))]:group(name,pid,d)

def image(name,rgb):
 h,w,_=rgb.shape;im=bpy.data.images.new(name,w,h,alpha=False)
 im.colorspace_settings.name='Non-Color'
 im.pixels.foreach_set(np.dstack((rgb,np.ones((h,w)))).astype(np.float32).ravel())
 im.filepath_raw=os.path.join(ROOT,'blender',name+'.png');im.file_format='PNG';im.save();im.pack();return im
n=512;y,x=np.mgrid[0:n,0:n]/n
height=.5+.18*np.sin(2*pi*x*32)*np.cos(2*pi*y*32)+.14*np.cos(2*pi*(y*32+x*2))
dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*1.8
dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*1.8
normal=np.stack((-dx,-dy,np.ones_like(dx)),axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
normalimg=image('textile-normal',normal*.5+.5)
roughimg=image('textile-roughness',np.repeat((.86+.1*height)[...,None],3,axis=-1))

# Photographed textile: preserve actual fibre variation while removing its green dye.
texdir=os.path.join(ROOT,'blender','textures')
def photo_texture(filename,noncolor=True):
 im=bpy.data.images.load(os.path.join(texdir,filename),check_existing=True)
 if noncolor:im.colorspace_settings.name='Non-Color'
 if im.size[0]>1024:im.scale(1024,round(im.size[1]*1024/im.size[0]))
 im.pack();return im
normalimg=photo_texture('poplin-nor_gl.jpg')
roughimg=photo_texture('poplin-rough.jpg')
sourcecolor=photo_texture('poplin-diff.jpg')
pixels=np.empty(len(sourcecolor.pixels),dtype=np.float32);sourcecolor.pixels.foreach_get(pixels)
rgba=pixels.reshape(sourcecolor.size[1],sourcecolor.size[0],4)
luma=rgba[:,:,:3]@np.array([.2126,.7152,.0722])
lo,hi=np.percentile(luma,[2,98])
neutral=.58+.36*np.clip((luma-lo)/(hi-lo),0,1)
colorimg=image('textile-colour',np.repeat(neutral[...,None],3,axis=-1))
colorimg.colorspace_settings.name='sRGB'
# Woven elastic has longitudinal ribs, unlike the finer cup cloth.
ey,ex=np.mgrid[0:512,0:512]/512
eh=.5+.30*np.cos(2*pi*ey*48)+.05*np.sin(2*pi*ex*90)
edx=(np.roll(eh,-1,1)-np.roll(eh,1,1))*3
edy=(np.roll(eh,-1,0)-np.roll(eh,1,0))*3
en=np.stack((-edx,-edy,np.ones_like(edx)),axis=-1);en/=np.linalg.norm(en,axis=-1,keepdims=True)
elasticnormal=image('elastic-normal',en*.5+.5)
elasticcolour=image('elastic-colour',np.repeat((.68+.22*eh)[...,None],3,axis=-1))
elasticcolour.colorspace_settings.name='sRGB'
def material(name,color,rough=.88,metal=0,textile=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');nt=m.node_tree
 b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 b.inputs['Specular IOR Level'].default_value=.22 if not metal else .5
 if textile:
  b.inputs['Sheen Weight'].default_value=.35;b.inputs['Sheen Roughness'].default_value=.65
  t=nt.nodes.new('ShaderNodeTexImage');t.image=elasticnormal if name=='trim' else normalimg;nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.9
  nt.links.new(t.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],b.inputs['Normal'])
  t=nt.nodes.new('ShaderNodeTexImage');t.image=roughimg;nt.links.new(t.outputs['Color'],b.inputs['Roughness'])
  # Bake dye into the colour image; glTF carries baseColor/normal/roughness together.
  tone=.68+.22*eh if name=='trim' else neutral
  dyed=image(name+'-colour',np.repeat(tone[...,None],3,axis=-1)*np.array(color)[None,None,:]**(1/2.2))
  dyed.colorspace_settings.name='sRGB'
  t=nt.nodes.new('ShaderNodeTexImage');t.image=dyed;nt.links.new(t.outputs['Color'],b.inputs['Base Color'])
 return m
fabric=material('fabric',(.25,.055,.095),textile=True)
lining=material('lining',(.20,.04,.073),textile=True)
trim=material('trim',(.21,.04,.077),textile=True)
thread=material('thread',(.34,.10,.145),.93)
metal=material('metal',(.52,.48,.44),.35,.82)

def mesh(name,vs,fs,mat,parent,uv=None,thickness=0):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
 o=bpy.data.objects.new('GEO-'+name,me);garment.objects.link(o);o.parent=groups[parent];me.materials.append(mat)
 for p in me.polygons:p.use_smooth=True
 if uv:
  layer=me.uv_layers.new(name='TextileUV')
  for poly in me.polygons:
   for li in poly.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 if thickness:
  mod=o.modifiers.new('Sewn fabric thickness','SOLIDIFY');mod.thickness=thickness;mod.offset=0
 return o
def patch(name,fn,mat,parent,nu=64,nv=24,thickness=.003):
 vs=[];uv=[];fs=[]
 for j in range(nv+1):
  for i in range(nu+1):
   p=fn(i/nu,j/nv);vs.append(p);uv.append((i/nu*1.25,j/nv*.9))
 for j in range(nv):
  for i in range(nu):
   a=j*(nu+1)+i;fs.append((a,a+1,a+nu+2,a+nu+1))
 return mesh(name,vs,fs,mat,parent,uv,thickness)
def tubes(name,paths,radius,mat,parent):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=radius;cu.bevel_resolution=2
 for pts in paths:
  sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
  for p,v in zip(sp.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new('GEO-'+name,cu);garment.objects.link(o);o.parent=groups[parent];cu.materials.append(mat);return o
def seam(name,fn,parent,count=100):
 paths=[]
 for i in range(count):paths.append([fn((i+t)/count) for t in (0,.3,.64)])
 return tubes(name,paths,.00065,thread,parent)
def cup(s,u,v,off=0):
 x=s*(.028+.411*u)
 bottom=.135-.082*sin(pi*u)+.09*u**4
 a=.265+.32*u;b=.505-1.02*(u-.75)
 top=min(a,b)-.012*math.log1p(math.exp(-abs(a-b)/.012))
 z=bottom+(top-bottom)*v
 hit,_,_,_=bvh.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
 base=-.285+.165*u**3-.18*max(0,sin(pi*u))**.7*max(0,sin(pi*v))**.55
 weight=min(1,u/.18,(1-u)/.12)*.68
 y=base*(1-weight)+max(-.49,min(-.16,hit.y if hit else base))*weight
 # Small tension folds where soft textile meets the curved seam, fading over the moulded cup.
 y+=.0025*sin(u*73+v*9)*math.exp(-v*13)*sin(pi*u)**2
 return (x,y-.0015-off,z)
for s,side in [(-1,'L'),(1,'R')]:
 g='cup_'+side
 patch('retopologized-cup-'+side,lambda u,v:cup(s,u,v),fabric,g)
 patch('soft-lining-'+side,lambda u,v:cup(s,u,1-v,-.004),lining,g,48,24,.001)
 tubes('cup-binding-'+side,[[cup(s,u/100,v,.001) for u in range(101)] for v in (0,1)],.0035,trim,g)
 seam('neckline-stitches-'+side,lambda t:cup(s,t,.97,.003),g)
 seam('cup-panel-seam-'+side,lambda t:cup(s,.65-.22*t,t,.0035),g,64)
 tubes('underwire-channel-'+side,[[cup(s,t/100,0,.004) for t in range(101)]],.006,trim,'wire')
 tubes('inner-steel-wire-'+side,[[cup(s,t/100,0,.004) for t in range(101)]],.0018,metal,'wire')
 seam('wire-stitching-'+side,lambda t:cup(s,t,.025,.007),'wire',100)

 # A curved wing follows the ribcage to the back closure.
 def wing(u,v,s=s):
  a=u*pi/2;x=s*(.439*cos(a)+.033*sin(a));y=-.1215+.5615*sin(a)
  bottom=.025+.035*u;top=.262-.042*sin(a)
  z=bottom+(top-bottom)*v
  y+=.0018*sin(u*85)*sin(pi*v)**2
  return (x,y,z)
 patch('powernet-wing-'+side,wing,fabric,'wing_'+side,72,18,.002)
 for v in (0,1):
  tubes('wing-edge-'+side+str(v),[[wing(t/100,v) for t in range(101)]],.004,trim,'wing_'+side)
  seam('wing-stitches-'+side+str(v),lambda t,v=v:wing(t,.03 if v==0 else .97),'wing_'+side)
 # Front lower band, following the inherited cup surface.
 patch('front-underband-'+side,lambda u,v:(lambda p:(p[0],p[1]+.002,p[2]-.008-(.03+.18*u**5)*v))(cup(s,u,0)),trim,'band',64,12,.003)
 tubes('elastic-underband-'+side,[[ (lambda p:(p[0],p[1],p[2]-.003))(wing(t/100,0)) for t in range(101)]],.0065,trim,'band')

 def strap(t,v,s=s):
  # Bezier passes over the shoulder, then drops to the rear band.
  p0=Vector(cup(s,.75,1));p0.z-=.005;p1=Vector((s*.355,p0.y,1.09));p2=Vector((s*.30,.42,1.02));p3=Vector((s*.283,.365,.216))
  p=p0*(1-t)**3+3*p1*(1-t)**2*t+3*p2*(1-t)*t*t+p3*t**3
  p.x+=(v-.5)*.033
  return tuple(p)
 patch('woven-strap-'+side,strap,trim,'strap_'+side,96,4,.003)
 for v in (.075,.925):seam('strap-topstitch-'+side+str(v),lambda t,v=v:strap(t,v),'strap_'+side,180)
 # Rectangular adjuster with rounded corners, positioned on the rear strap.
 pt=Vector(strap(.78,.5));pts=[]
 for i in range(65):
  a=2*pi*i/64;pts.append((pt.x+.022*math.copysign(abs(cos(a))**.4,cos(a)),pt.y+.009,pt.z+.016*math.copysign(abs(sin(a))**.4,sin(a))))
 tubes('adjuster-'+side,[pts,[(pt.x-.021,pt.y+.010,pt.z),(pt.x+.021,pt.y+.010,pt.z)]],.0022,metal,'strap_'+side)

# Centre bridge supports the two cups.
patch('centre-bridge',lambda u,v:((u-.5)*.07,-.28-.03*v,.063+.16*v),fabric,'band',10,12,.003)
# Tied ribbon loops and two tails.
for s in (-1,1):
 patch('bow-loop'+str(s),lambda u,v:(s*(.007+.044*sin(pi*u)), -.315-.020*sin(pi*u)+(v-.5)*.008, .158+.016*sin(2*pi*u)+(v-.5)*.012),trim,'bow',40,4,.0015)
 patch('bow-tail'+str(s),lambda u,v:(s*(.006+.021*u)+(v-.5)*.016,-.317-.006*sin(pi*u),.155-.045*u),trim,'bow',20,3,.001)
patch('bow-knot',lambda u,v:((u-.5)*.014,-.333-.003*sin(pi*u),.148+v*.02),trim,'bow',10,8,.007)

# Two separate closure tabs and six actual eye loops, two hook wires.
for s in (-1,1):
 patch('closure-tab'+str(s),lambda u,v,s=s:(s*(.002+.051*u),.449+.001*cos(pi*u),.065+.151*v),trim,'hook',12,20,.007)
 for edge in (.045,.955):seam('tab-stitch'+str(s)+str(edge),lambda t,s=s,e=edge:(s*(.004+.047*t),.454,.065+.151*e),'hook',18)
 seam('tab-side-stitch'+str(s),lambda t,s=s:(s*.048,.454,.071+.139*t),'hook',44)
for z in (.102,.179):
 for x in (-.041,-.025,-.009):
  pts=[(x+.005*cos(2*pi*i/32),.457+.003*sin(pi*i/32),z+.007*sin(2*pi*i/32)) for i in range(33)]
  tubes('eye-'+str(x)+str(z),[pts],.0012,metal,'hook')
 pts=[(.027,.458,z),(.017,.460,z),(.006,.468,z),(-.006,.468,z),(-.011,.466,z),(-.011,.460,z)]
 tubes('hook-wire'+str(z),[pts],.0017,metal,'hook')

anchors={'cup':('cup_R',cup(1,.42,.55,.016)),'wire':('wire',cup(-1,.40,.0,.025)),'bow':('bow',(0,-.35,.16)),'strap':('strap_R',(.35,-.08,.77)),'wing':('wing_L',(-.445,.11,.17)),'band':('band',(.22,-.31,.035)),'hook':('hook',(0,.48,.14))}
for pid,(par,loc) in anchors.items():
 o=bpy.data.objects.new('anchor_'+pid,None);garment.objects.link(o);o.parent=groups[par];o.location=loc;o['partId']=pid

# Convert spline details for portable GLB export; keep editable mesh parts in .blend.
for o in list(garment.objects):
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Combine fine threads by parent/material to keep draw calls bounded.
for par in groups.values():
 for mat in (fabric,lining,trim,thread,metal):
  objects=[o for o in par.children if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
  if len(objects)>1:
   bpy.ops.object.select_all(action='DESELECT')
   for o in objects:
    o.select_set(True);bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
   bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
   objects[0].name='GEO-'+par.name+'-'+mat.name

bpy.ops.object.select_all(action='DESELECT')
for o in garment.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=90,use_selection=True,export_extras=True,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=7)
scene['source']='Tripo-derived cup surface from aligngr44/3D-site-deneme; new retopology and independent garment details by Codex.'
scene['purpose']='Interactive design demonstration, not a sewing pattern or verified manufactured product.'
studio=bpy.data.collections.new('STUDIO — render only');scene.collection.children.link(studio)
target=Vector((0,.0,.43))
def aim(o):o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,energy,size in [('Key',(1,-2,3),180,3),('Fill',(-2,-1,1),100,2),('Rim',(0,2,2),160,2)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.size=size;o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=pos;aim(o)
cam=bpy.data.objects.new('Camera',bpy.data.cameras.new('Camera'));studio.objects.link(cam);scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=1.45;cam.location=(.65,-2.5,1);aim(cam)
scene.world.color=(.65,.65,.65);scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1200;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','ebru-sutyen.blend'),compress=True)
for name,pos in [('front',(.65,-2.5,1)),('back',(.4,2.5,.95))]:
 cam.location=pos;aim(cam);scene.render.filepath=os.path.join(ROOT,'blender',name+'.png');bpy.ops.render.render(write_still=True)
print(json.dumps({'glb':OUT,'bytes':os.path.getsize(OUT),'parts':len(groups),'mesh_objects':len([o for o in garment.objects if o.type=='MESH'])}))
