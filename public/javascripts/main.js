// F U N C T I O N     T O     R E N D E R     D O C T O R _ P O R T A L     P A G E
function doctor_portal(event){
    event.preventDefault();
    window.location.href='/';
}



// F U N C T I O N     T O     R E N D E R     P A T I E N T _ P O R T A L     P A G E
function patient_portal(event){
    event.preventDefault();
    window.location.href='/patients_reg';
}



// F U N C T I O N     T O     R E N D E R     A D M I N _ P O R T A L     P A G E
function admin_portal(event){
    event.preventDefault();
    window.location.href='/admin_reg';
}

function transactions_portal(event) {
    // Redirige l'utilisateur vers la page des transactions
    window.location.href = '/transactions'; // Remplacez '/transactions' par le chemin réel si nécessaire
}


// F U N C T I O N     T O     A D D     D O C T O R     I N F O 
function addDoctor(event) {
    event.preventDefault();

    // Récupération des valeurs
    var state = document.getElementById('d_state').value;
    var adrs = document.getElementById('d_Id').value;
    var name = document.getElementById('d_Name').value;
    var a_adrs = sessionStorage.getItem('admin_adrs');

    // Vérification des champs
    if (state.length === 0 || adrs.length === 0 || name.length === 0) {
        alert("Please fill in all the fields.");
        return;
    }

    // Vérification de l'adresse (exemple pour une adresse Ethereum)
    if (!/^0x[a-fA-F0-9]{40}$/.test(adrs)) {
        alert("Please enter a valid Ethereum address.");
        return;
    }

    // Envoi de la requête POST
    $.post('/setDrRecords', {d_state: state, d_adrs: adrs, d_name: name, admin_adrs: a_adrs}, (data, textStatus, jqXHR) => {
        if (data.done == 1) {
            alert(data.message);
            window.location.href = '/setDrRecords';
        } else {
            alert(data.message);  // Affichage du message d'erreur renvoyé par le serveur
        }
    }, 'json');
}



// F U N C T I O N     T O     R E T R E I V E     D O C T O R     I N F O
function getDoctor(event){
    event.preventDefault();
    var dr_adrs = document.getElementById('dr_Id').value;
    var a_adrs = sessionStorage.getItem('admin_adrs');
    
    if(dr_adrs.length !== 42){
        alert("ENTER REGISTERED DR ADDRESS");
    }
    else{
        $.post('/getDrRecords', {d_adrs: dr_adrs, adm_adrs: a_adrs}, (data, textStatus, jqXHR) => {
            if(data.done == 1 && data.result){
                var state = data.result.state ? "REGISTERED" : "NOT REGISTERED";
                document.getElementById('name').innerHTML = data.result.name;
                document.getElementById('dr').innerHTML = data.result.address;
                document.getElementById('state').innerHTML = state;
            } else {
                alert("DOCTOR ADDRESS NOT FOUND");
                window.location.href='/setDrRecords';
            }
        }, 'json');
    }
}



function addHealthRecords(event) {
    event.preventDefault();

    // Récupérer les valeurs des champs du formulaire
    var patient_name = document.getElementById('patientName').value;
    var patient_adrs = document.getElementById('patientId').value;
    var inscription = document.getElementById('inscription').value;
    var doctor_adrs = sessionStorage.getItem('doctor_address'); // Adresse du médecin (docteur)
    console.log("🚀 ~ addHealthRecords ~ doctor_adrs:", doctor_adrs)
    
    // Validation des champs
    if (!patient_name || !patient_adrs || !inscription) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    if (!doctor_adrs || doctor_adrs.length !== 42) {
        alert("L'adresse du médecin est invalide.");
        return;
    }

    // Envoi des données via POST
    $.post('/setHealthRecords', {
        patient_name: patient_name,
        patient_adrs: patient_adrs,
        inscription: inscription,
        doctor_adrs: doctor_adrs
    }, (data, textStatus, jqXHR) => {
        if (data.done === 1) {
            alert("Dossier médical ajouté avec succès.");
            // Vous pouvez rediriger ou afficher un message de confirmation
        } else {
            alert(data.message || "Une erreur est survenue.");
        }
    }, 'json');
}



// F U N C T I O N     T O     R E T R E I V E     H E A L T H R E C O R D S     I N F O     F O R     D O C T O R S 
function getHealthRecords(event){
    event.preventDefault();
    // var dr_adrs = document.getElementById('d_Id').value;
    var pa_adrs = document.getElementById('p_Id').value;
    var d_adrs = sessionStorage.getItem('doctor_adrs');
    if(pa_adrs.length !== 42){
        alert("ENTER REGISTERED PATIENT ADDRESS");
        window.location.href="/addHealthRecords";
    }
    else{
        $.post('/getHealthRecords',{pid: pa_adrs,d_adrs:d_adrs},(data, textStatus, jqXHR)=>{
         if(data.done == 1 && data.result._drName!=''){
            document.getElementById('paname').innerHTML=data.result._paName;
            document.getElementById('drname').innerHTML=data.result._drName;
            document.getElementById('drid').innerHTML=data.result._drId;
            document.getElementById('paid').innerHTML=data.result._pId;
            document.getElementById('drprescription').innerHTML=data.result._prescription;
            document.getElementById('records').innerHTML=data.result._rec;
            // alert("DR NAME : "+data.result._drName+"\nDR ID : "+data.result._drId+"\nPATIENT NAME : "+data.result._paName+"\nPATIENT ID : "+data.result._pId+"\nPRESCRIPTON : "+data.result._prescription+"\nRECORDS: : "+data.result._rec);
            // window.location.href='/addHealthRecords';
        }
        else{
            alert("ACCESS REVOKED");
            window.location.href='/addHealthRecords';
        }
        }, 'json');
    }

}


// F U N C T I O N     T O     R E T R E I V E     H E A L T H R E C O R D S     I N F O     F O R     P A T I E N T S
function getHealthRecordsForPatients(event){
    event.preventDefault();
    var dr_adrs = document.getElementById('drId').value;
    var p_adrs = sessionStorage.getItem('patient_adrs');
    if(dr_adrs.length !== 42){
        alert("ENTER REGISTERED DR ADDRESS");
        window.location.href="/patient_access";
    }
    else{
        $.post('/getHealthRecordsForPatients',{did: dr_adrs,p_adrs:p_adrs},(data, textStatus, jqXHR)=>{
         if(data.done == 1 && data.result._drName!=''){
            document.getElementById('paname').innerHTML=data.result._paName;
            document.getElementById('drname').innerHTML=data.result._drName;
            document.getElementById('drid').innerHTML=data.result._drId;
            document.getElementById('paid').innerHTML=data.result._paId;
            document.getElementById('drprescription').innerHTML=data.result._prescription;
            document.getElementById('records').innerHTML=data.result._rec;
            // alert("DR NAME : "+data.result._drName+"\nDR ID : "+data.result._drId+"\nPATIENT NAME : "+data.result._paName+"\nPATIENT ID : "+data.result._paId+"\nPRESCRIPTON : "+data.result._prescription+"\nPRESCRIPTON RECORDS : "+data.result._rec);
            // window.location.href='/patient_access';
        }
        else{
            alert("ENTER GENUINE ADDRESS ONLY");
            window.location.href='/patient_access';
        }
        }, 'json');
    }

}


// F U N C T I O N     T O     L O G I N     A S     A D M I N
function admin_login(address) {
    $.post('/admin_reg', { a_adrs: address }, (data, textStatus, jqXHR) => {
        if (data.done == 1) {
            sessionStorage.clear();
            sessionStorage.setItem("admin_adrs", data.adrs);
            window.location.href = '/setDrRecords';
        }
        else {
            window.location.href = '/';
        }
    });
}


// F U N C T I O N     T O     L O G I N     A S     D O C T O R
function doctor_login(doctor) {

    $.post('/doctor_reg', { d_adrs: doctor, }, (data, textStatus, jqXHR) => {
        if (data.done == 1) {
            sessionStorage.clear();
            sessionStorage.setItem("doctor_adrs", data.dadrs);
            alert(data.message);
            window.location.href = '/addHealthRecords';
        }
        else {
            window.location.href = '/';
        }
    }, 'json');
}



// F U N C T I O N     T O     L O G I N     A S     P A T I E N T
function patient_login(patient) {
    $.post('/patients_reg', { p_adrs: patient }, (data, textStatus, jqXHR) => {
        if (data.done == 1) {
            sessionStorage.clear();
            sessionStorage.setItem("patient_adrs", data.padrs);
            alert(data.message);
            window.location.href = '/patient_access';
        }
        else {
            window.location.href = '/';
        }
    }, 'json');
}


// F U N C T I O N     T O     G R A N T     A C C E S S     T O     D O C T O R S 
function grantAccessToDoctor(event){
    event.preventDefault();
    var dr_adrs = document.getElementById('doctorId').value;
    var p_adrs = sessionStorage.getItem('patient_adrs');
    var access = document.getElementById('access').value;
    console.log(",ghfgdhfhdgfhgdvwcsed"+access);
    if(dr_adrs.length !== 42 || access.length === 0){
        alert("ENTER REGISTERED DR ADDRESS & PERMISSION STATUS");
    }
    else{
        $.post('/grantAccessToDoctor',{did: dr_adrs,p_adrs:p_adrs,access:access},(data, textStatus, jqXHR)=>{
         if(data.done == 1){
            alert("ACCESS GRANTED");
            window.location.href='/patient_access';
        }
        else{
            window.location.href='/';
        }
        }, 'json');
    }

}



// F U N C T I O N     T O     R E T R E I V E     H E A L T H R E C O R D S     H I S T O R Y     I N F O     F O R     D O C T O R S
function getHealthRecordsHistory(event){
    event.preventDefault();
    var pa_adrs = document.getElementById('patient_Id').value;
    var d_adrs = sessionStorage.getItem('doctor_adrs');
    if(pa_adrs.length !== 42){
        alert("ENTER REGISTERED DR ADDRESS");
        window.location.href="/addHealthRecords";
    }
    else{
        $.post('/getHealthRecordsHistory',{pid: pa_adrs,d_adrs:d_adrs},(data, textStatus, jqXHR)=>{
         if(data.done == 1 && data.result._paName!=''){
            var state;
            if(data.result._state){
                state = "REGISTERED";
            }
            else{
                state = "NOT REGISTERED";
            }
            document.getElementById('name').innerHTML=data.result._paName;
            document.getElementById('id').innerHTML=data.result._paId;
            document.getElementById('status').innerHTML=state;
            document.getElementById('prescription').innerHTML=data.result._paRecords;
            // alert("PATIENT NAME : "+data.result._paName+"\nPATIENT ID : "+data.result._paId+"\nPATIENT STATUS : "+state+"\nPRESCRIPTON RECORDS : "+data.result._paRecords);
            // window.location.href='/addHealthRecords';
        }
        else{
            alert("ACCESS REVOKED");
            window.location.href='/addHealthRecords';
        }
        }, 'json');
    }

}



// F U N C T I O N     T O     R E T R E I V E     H E A L T H R E C O R D S     H I S T O R Y     I N F O     F O R     P A T I E N T S
function getHealthRecordsHistoryForPatients(event){
    event.preventDefault();
    var p_adrs = sessionStorage.getItem('patient_adrs');
    $.post('/getHealthRecordsHistoryForPatients',{p_adrs:p_adrs},(data, textStatus, jqXHR)=>{
        if(data.done == 1){
           var state;
           if(data.result._state){
               state = "REGISTERED";
           }
           else{
               state = "NOT REGISTERED";
           }
           document.getElementById('name').innerHTML=data.result._paName;
           document.getElementById('id').innerHTML=data.result._paId;
           document.getElementById('status').innerHTML=state;
           document.getElementById('prescription').innerHTML=data.result._paRecords;
        //    alert("PATIENT NAME : "+data.result._paName+"\nPATIENT ID : "+data.result._paId+"\nPATIENT STATUS : "+state+"\nPRESCRIPTON RECORDS : "+data.result._paRecords);
        //    window.location.href='/patient_access';
       }
       else{
           window.location.href='/';
       }
       }, 'json');
    

}



// F U N C T I O N     T O     L O G O U T     O F     S E S S I O N
function logout_med(event){
    event.preventDefault();
    sessionStorage.clear();
    window.location.href='/';
}