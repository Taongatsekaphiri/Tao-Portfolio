// CONTACT PAGE (GET)
app.get('/contact', (req, res) => {
    // Get the latest contact info from the database
    db.get(`SELECT * FROM contact_info ORDER BY updated_at DESC LIMIT 1`, [], (err, row) => {
        if (err) {
            console.error("DB ERROR:", err);
            // fallback to default dummy data
            row = {
                email: 'tsekaphiritaonga@gmail.com',
                phone: '+265998888020',
                location: 'Lilongwe, Malawi',
                github: 'https://github.com/taongatsekaphiri',
                linkedin: 'https://linkedin.com/in/taonga-tseka-phiri',
                title: "Let's Build Something Remarkable",
                subtitle: "Feeling social? Find me on these online spaces too!"
            };
        }

        res.render('contact', {
            page: 'contact',
            contact: row,
            pageStyles: `
                <link rel="stylesheet" href="/css/style.css">
                <link rel="stylesheet" href="/css/contact.css">
            `
        });
    });
});
