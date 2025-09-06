const { supabase } = require('../lib/supabase');

async function testDownload() {
  try {
    const { data, error } = await supabase.storage
      .from('bots')
      .download('Stem_project_01_1756907166946.pdf');
    if (error) throw error;
    console.log(
      'Download successful, data size:',
      await data?.arrayBuffer().then((buf: ArrayBuffer) => buf.byteLength)
    );
  } catch (error) {
    console.error('Download error:', error);
  }
}

testDownload();

