'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {PDFDocument,PDFTextField,PDFCheckBox,PDFDropdown,PDFButton,PDFDict,PDFName}=require('pdf-lib');
const R=require('./engine.js'),Print=require('./print.js');
module.exports=async function fillOfficial(raw){
 const c=R.validateImport(R.pack([raw]),{preserveIds:true})[0];
 const original=await fs.readFile(path.join(__dirname,'livros/ficha-oficial.pdf'));
 const doc=await PDFDocument.load(original),form=doc.getForm(),values=Print.officialFields(c,R);
 for(const field of form.getFields()){
  const name=field.getName();if(!(name in values))throw Error('Campo oficial sem mapeamento: '+name);
  const value=values[name];
  if(field instanceof PDFTextField)field.setText(String(value??''));
  else if(field instanceof PDFCheckBox){
   for(const widget of field.acroField.getWidgets()){
    const rect=widget.getRectangle(),appearances=widget.getAppearances();
    for(const appearance of [appearances?.normal,appearances?.down,appearances?.rollover]){
     // Some source fields have only a checked state. Supply a transparent Off
     // appearance so readers can uncheck them without replacing native dots.
     if(appearance instanceof PDFDict&&!appearance.has(PDFName.of('Off'))){
      const off=doc.context.flateStream('q\nQ\n',{Type:'XObject',Subtype:'Form',BBox:[0,0,rect.width,rect.height],Resources:{}});
      appearance.set(PDFName.of('Off'),doc.context.register(off));
     }
    }
   }
   if(value)field.check();else field.uncheck();
   // The template already contains circle/square appearances for each native state.
   // Regenerating them would draw square borders over the original circles.
   form.markFieldAsClean(field.ref);
  }
  else if(field instanceof PDFDropdown)field.select(String(value||' '));
  else if(field instanceof PDFButton)continue; // Keep the original interactive portrait/sketch buttons.
  else throw Error('Tipo de campo oficial não suportado: '+name);
 }
 try{form.updateFieldAppearances()}catch(e){throw Error('A fonte da ficha oficial não suporta algum caractere deste personagem. Use o PDF completo em português, que preserva o texto. '+e.message)}
 return doc.save();
};
