import Contact from '@/modules/Contact/Contact';

const ContactPage = () => {
  return <Contact />;
};

(ContactPage as any).meta = {
  title: 'Contact',
  description: 'Get in touch with the GitKarma team for support or to provide feedback.',
};

export default ContactPage;
